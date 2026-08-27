import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ExperienceItemDto {
  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsString()
  @IsOptional()
  description?: string;
}
