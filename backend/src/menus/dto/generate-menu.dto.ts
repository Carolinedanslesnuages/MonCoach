import { IsOptional, IsString } from 'class-validator';

export class GenerateMenuDto {
  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  additionalInstructions?: string;
}
