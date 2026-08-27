import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  answer: string;
}
