import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { InterviewService } from './interview.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(AccessTokenGuard, ThrottlerGuard)
@Controller('ai/interview/sessions')
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post()
  start(@CurrentUser() user: { userId: string }, @Body() dto: StartSessionDto) {
    return this.interviewService.startSession(user.userId, dto.type ?? 'mixed');
  }

  @Post(':id/answer')
  answer(
    @CurrentUser() user: { userId: string },
    @Param('id') sessionId: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.interviewService.submitAnswer(user.userId, sessionId, dto.answer);
  }

  // Read-only, no Gemini call — exempted from the throttle budget for the
  // same reason as AiController's list/get routes (see its comment).
  @SkipThrottle()
  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.interviewService.listSessions(user.userId);
  }

  @SkipThrottle()
  @Get(':id')
  getOne(@CurrentUser() user: { userId: string }, @Param('id') sessionId: string) {
    return this.interviewService.getSession(user.userId, sessionId);
  }

  // Deleting is a DB write but not a Gemini call — exempt from the AI
  // generation throttle budget for the same reason as list/get above.
  @SkipThrottle()
  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') sessionId: string) {
    return this.interviewService.deleteSession(user.userId, sessionId);
  }
}
