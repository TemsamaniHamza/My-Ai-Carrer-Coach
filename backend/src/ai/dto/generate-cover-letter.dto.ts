import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GenerateCoverLetterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8000) // keeps the prompt within a reasonable size for the free tier
  jobDescription: string;
}
