import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { GenerateCoverLetterDto } from './dto/generate-cover-letter.dto';
import { RenameItemDto } from './dto/rename-item.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Free-tier Gemini quota is easy to exhaust — ThrottlerGuard here (using the
// 'default' 10-req/60s config from AiModule's ThrottlerModule.forRoot) caps
// each caller across cover-letter generation so one runaway client script
// can't burn through the whole app's quota. Applied only to this
// controller, not globally — see the comment in ai.module.ts. Every route
// below that doesn't call Gemini (list/get/rename/delete) is explicitly
// exempted via @SkipThrottle() — they never touch the AI quota, so sharing
// a budget with generation calls only means a user managing their own saved
// history can get wrongly rate-limited (this happened during testing: rapid
// POSTs ate the quota, then a plain GET of already-saved data came back
// 429, which looked like the data had vanished).
//
// Resume generation used to live here too. It's now a deterministic
// template rendered client-side from the live profile (see
// ResumePanel/ResumeTemplate) — no AI call, no saved history, so there are
// no /ai/resumes routes anymore. The Resume Prisma model/table is
// deliberately left in place unused rather than dropped — it still holds
// resumes generated before this change, and deleting that data wasn't
// worth the risk for a routes cleanup.
@UseGuards(AccessTokenGuard, ThrottlerGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('cover-letters')
  async generateCoverLetter(
    @CurrentUser() user: { userId: string },
    @Body() dto: GenerateCoverLetterDto,
  ) {
    const letter = await this.aiService.generateCoverLetter(user.userId, dto.jobDescription);
    return {
      id: letter.id,
      name: letter.name,
      letter: letter.content,
      createdAt: letter.createdAt,
    };
  }

  @SkipThrottle()
  @Get('cover-letters')
  listCoverLetters(@CurrentUser() user: { userId: string }) {
    return this.aiService.listCoverLetters(user.userId);
  }

  @SkipThrottle()
  @Get('cover-letters/:id')
  async getCoverLetter(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    const letter = await this.aiService.getCoverLetter(user.userId, id);
    return {
      id: letter.id,
      name: letter.name,
      letter: letter.content,
      createdAt: letter.createdAt,
    };
  }

  @SkipThrottle()
  @Patch('cover-letters/:id')
  async renameCoverLetter(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: RenameItemDto,
  ) {
    const letter = await this.aiService.renameCoverLetter(user.userId, id, dto.name);
    return { id: letter.id, name: letter.name };
  }

  @SkipThrottle()
  @Delete('cover-letters/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCoverLetter(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.aiService.deleteCoverLetter(user.userId, id);
  }
}
