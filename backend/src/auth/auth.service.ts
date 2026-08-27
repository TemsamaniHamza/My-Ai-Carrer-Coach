import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { stripPassword } from '../common/strip-password.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { parseExpiryToMs, parseExpiryToSeconds } from './utils/token-expiry.util';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
    });

    return stripPassword(user);
  }

  async validateCredentials(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  private signAccessToken(userId: string, email: string) {
    return this.jwtService.sign(
      { sub: userId, email },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: parseExpiryToSeconds(process.env.JWT_ACCESS_EXPIRY ?? '1h'),
      },
    );
  }

  /**
   * Creates a new RefreshToken DB row + signs a matching JWT (jti = row id).
   * Returns the signed JWT to be set as an httpOnly cookie.
   */
  private async issueRefreshToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, BCRYPT_SALT_ROUNDS);
    const expiresAt = new Date(
      Date.now() + parseExpiryToMs(process.env.JWT_REFRESH_EXPIRY ?? '7d'),
    );

    const tokenRow = await this.prisma.refreshToken.create({
      data: { hashedToken, userId, expiresAt },
    });

    return this.jwtService.sign(
      { sub: userId, jti: tokenRow.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: parseExpiryToSeconds(process.env.JWT_REFRESH_EXPIRY ?? '7d'),
      },
    );
  }

  async login(dto: LoginDto) {
    const user = await this.validateCredentials(dto);
    const accessToken = this.signAccessToken(user.id, user.email);
    const refreshToken = await this.issueRefreshToken(user.id);
    return { accessToken, refreshToken, user: stripPassword(user) };
  }

  /**
   * Rotates a refresh token: revokes the old DB row, issues a new one.
   * tokenId = jti from the refresh JWT payload (which DB row to check/revoke).
   */
  async refresh(userId: string, tokenId: string) {
    const tokenRow = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
    });

    if (
      !tokenRow ||
      tokenRow.userId !== userId ||
      tokenRow.revoked ||
      tokenRow.expiresAt < new Date()
    ) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { revoked: true },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const accessToken = this.signAccessToken(user.id, user.email);
    const refreshToken = await this.issueRefreshToken(user.id);
    return { accessToken, refreshToken };
  }

  async logout(tokenId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { id: tokenId, revoked: false },
      data: { revoked: true },
    });
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return stripPassword(user);
  }
}
