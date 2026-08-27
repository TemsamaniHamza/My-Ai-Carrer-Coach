import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import { buildResumePrompt } from './prompts/resume.prompt';
import { buildCoverLetterPrompt } from './prompts/cover-letter.prompt';
import { defaultName } from './utils/default-name.util';

const PREVIEW_LENGTH = 120;

function makePreview(text: string): string {
  const firstLine = text.split('\n').find((line) => line.trim().length > 0) ?? text;
  const stripped = firstLine.replace(/^#+\s*/, '').trim(); // drop a leading markdown heading marker
  return stripped.length > PREVIEW_LENGTH ? `${stripped.slice(0, PREVIEW_LENGTH)}…` : stripped;
}

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  private async getOwnedResume(userId: string, id: string) {
    const resume = await this.prisma.resume.findUnique({ where: { id } });
    // Same 404 whether it doesn't exist or belongs to someone else — don't
    // leak which case it is.
    if (!resume || resume.userId !== userId) {
      throw new NotFoundException('Resume not found');
    }
    return resume;
  }

  private async getOwnedCoverLetter(userId: string, id: string) {
    const letter = await this.prisma.coverLetter.findUnique({ where: { id } });
    if (!letter || letter.userId !== userId) {
      throw new NotFoundException('Cover letter not found');
    }
    return letter;
  }

  async generateResume(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const markdown = await this.gemini.generateText(buildResumePrompt(user));
    return this.prisma.resume.create({
      data: { userId, markdown, name: defaultName('Resume') },
    });
  }

  async listResumes(userId: string) {
    const resumes = await this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return resumes.map((r) => ({
      id: r.id,
      name: r.name,
      createdAt: r.createdAt,
      preview: makePreview(r.markdown),
    }));
  }

  async getResume(userId: string, id: string) {
    return this.getOwnedResume(userId, id);
  }

  async renameResume(userId: string, id: string, name: string) {
    await this.getOwnedResume(userId, id);
    return this.prisma.resume.update({ where: { id }, data: { name } });
  }

  async deleteResume(userId: string, id: string) {
    await this.getOwnedResume(userId, id);
    await this.prisma.resume.delete({ where: { id } });
  }

  async generateCoverLetter(userId: string, jobDescription: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const content = await this.gemini.generateText(
      buildCoverLetterPrompt(user, jobDescription),
    );
    return this.prisma.coverLetter.create({
      data: { userId, content, jobDescription, name: defaultName('Cover Letter') },
    });
  }

  async listCoverLetters(userId: string) {
    const letters = await this.prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return letters.map((l) => ({
      id: l.id,
      name: l.name,
      createdAt: l.createdAt,
      preview: makePreview(l.content),
    }));
  }

  async getCoverLetter(userId: string, id: string) {
    return this.getOwnedCoverLetter(userId, id);
  }

  async renameCoverLetter(userId: string, id: string, name: string) {
    await this.getOwnedCoverLetter(userId, id);
    return this.prisma.coverLetter.update({ where: { id }, data: { name } });
  }

  async deleteCoverLetter(userId: string, id: string) {
    await this.getOwnedCoverLetter(userId, id);
    await this.prisma.coverLetter.delete({ where: { id } });
  }
}
