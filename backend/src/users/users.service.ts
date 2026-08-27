import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { stripPassword } from '../common/strip-password.util';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return stripPassword(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // class-validator/class-transformer give us DTO class instances; Prisma's
    // Json[] columns want plain JSON values, so normalize before writing.
    const data: Prisma.UserUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.summary !== undefined) data.summary = dto.summary;
    if (dto.skills !== undefined) data.skills = dto.skills;
    if (dto.languages !== undefined) data.languages = dto.languages;
    if (dto.experience !== undefined) {
      data.experience = dto.experience.map((item) => ({ ...item }));
    }
    if (dto.education !== undefined) {
      data.education = dto.education.map((item) => ({ ...item }));
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return stripPassword(user);
  }
}
