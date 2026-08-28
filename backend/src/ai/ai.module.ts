import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiService } from './gemini.service';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';

@Module({
  // Deliberately NOT registered via APP_GUARD — that would apply throttling
  // globally to every route in the app (including /auth, /users). Instead
  // ThrottlerGuard is applied only to AiController/InterviewController via
  // @UseGuards, so this module just needs to make ThrottlerModule's
  // providers available to it.
  imports: [ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 10 }])],
  controllers: [AiController, InterviewController],
  providers: [AiService, GeminiService, InterviewService],
  // GeminiService is exported so UsersModule can reuse it for resume-import
  // extraction, rather than standing up a second Gemini client.
  exports: [GeminiService],
})
export class AiModule {}
