import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EducationItemDto {
  @IsString()
  @IsNotEmpty()
  institution: string;

  @IsString()
  @IsNotEmpty()
  degree: string;

  @IsString()
  @IsNotEmpty()
  duration: string;

  @IsString()
  @IsOptional()
  description?: string;
}
