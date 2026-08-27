import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RenameItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
