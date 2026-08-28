import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { stripPassword } from '../common/strip-password.util';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GeminiService } from '../ai/gemini.service';
import {
  extractResumeText,
  isSupportedResumeFile,
  MAX_RESUME_FILE_BYTES,
} from './utils/extract-resume-text.util';
import { buildExtractProfilePrompt } from '../ai/prompts/extract-profile-from-resume.prompt';
import { parseExtractedProfileResponse } from '../ai/prompts/parse-extracted-profile-response';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

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

  /**
   * Extracts structured profile fields from an uploaded resume (PDF/DOCX).
   * Deliberately returns the extracted data instead of writing it — the
   * caller decides whether to apply it, so an upload never silently
   * overwrites a profile the user already filled in by hand.
   */
  async extractProfileFromResume(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    if (file.size > MAX_RESUME_FILE_BYTES) {
      throw new BadRequestException('That file is too large — resumes must be under 5MB.');
    }
    if (!isSupportedResumeFile(file.mimetype)) {
      throw new BadRequestException('Unsupported file type — upload a PDF or DOCX resume.');
    }

    const text = await extractResumeText(file.buffer, file.mimetype);
    if (!text.trim()) {
      throw new BadRequestException(
        "Couldn't find any text in that file — it may be a scanned image rather than text.",
      );
    }

    const raw = await this.gemini.generateText(buildExtractProfilePrompt(text));
    return parseExtractedProfileResponse(raw);
  }
}
