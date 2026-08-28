import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  // AiModule (for GeminiService) is needed by the resume-import feature —
  // extracting structured profile fields from an uploaded resume reuses
  // the same Gemini client the rest of the app's AI features use.
  //
  // Deliberately NOT a second ThrottlerModule.forRoot() here: ThrottlerModule
  // is @Global(), and forRoot() registers a fresh ThrottlerStorageProvider
  // each time it's called — a second call doesn't share AiModule's counter,
  // it creates an independent one, silently doubling the effective Gemini
  // quota across the two controllers. AiModule's single forRoot() call
  // already makes ThrottlerGuard/storage available everywhere (global), so
  // this module only needs AiModule imported, not ThrottlerModule again.
  imports: [AiModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
