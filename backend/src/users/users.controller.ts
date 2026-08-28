import {
  ArgumentsHost,
  Body,
  Catch,
  Controller,
  ExceptionFilter,
  Get,
  Patch,
  PayloadTooLargeException,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MAX_RESUME_FILE_BYTES } from './utils/extract-resume-text.util';

// FileInterceptor throws PayloadTooLargeException from within the request
// pipeline (Multer rejects the stream) BEFORE the controller method body
// ever runs — confirmed directly (a try/catch inside the handler below does
// NOT see this error; verified with a real 6MB upload against a running
// instance). An exception filter is the only place that can intercept it,
// since filters run regardless of where in the pipeline the throw happened.
// This swaps in the same wording UsersService uses for the same case
// (over the limit), rather than Multer's generic "File too large".
@Catch(PayloadTooLargeException)
class ResumeFileTooLargeFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(400).json({
      statusCode: 400,
      message: 'That file is too large — resumes must be under 5MB.',
      error: 'Bad Request',
    });
  }
}

// ThrottlerGuard applies to every route here by default (same free-tier
// Gemini quota concern as AiController) but /users/me itself doesn't call
// Gemini, so it's exempted via @SkipThrottle() the same way AiController
// exempts its non-AI routes.
@UseGuards(AccessTokenGuard, ThrottlerGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @SkipThrottle()
  @Get('me')
  getProfile(@CurrentUser() user: { userId: string }) {
    return this.usersService.getProfile(user.userId);
  }

  @SkipThrottle()
  @Patch('me')
  updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.userId, dto);
  }

  // Returns the extracted fields only — it never writes to the profile.
  // The frontend shows them as a review step and calls PATCH /users/me
  // itself if the user chooses to apply them.
  //
  // The size limit is enforced here at the interceptor level (multer drops
  // the upload before it ever reaches the service) as well as again in
  // UsersService — belt and suspenders, since a mismatch between the two
  // would otherwise fail confusingly (e.g. an over-limit file silently
  // truncated by multer instead of rejected). ResumeFileTooLargeFilter
  // (above) normalizes the interceptor's rejection message to match.
  @Post('me/resume-import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_RESUME_FILE_BYTES } }))
  @UseFilters(ResumeFileTooLargeFilter)
  extractProfileFromResume(
    @CurrentUser() _user: { userId: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.extractProfileFromResume(file);
  }
}
