import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    // AiModule (for GeminiService) is needed by the resume-import feature —
    // extracting structured profile fields from an uploaded resume reuses
    // the same Gemini client the rest of the app's AI features use.
    AiModule,
    // Same reasoning as AiModule's ThrottlerModule.forRoot — resume import
    // calls Gemini, so it needs the same free-tier-quota guard as
    // AiController. A second forRoot() here is fine: Nest scopes it to this
    // module rather than sharing AiModule's instance, and both use the same
    // 'default' throttle name/limits, so behavior is identical either way.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 10 }]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
