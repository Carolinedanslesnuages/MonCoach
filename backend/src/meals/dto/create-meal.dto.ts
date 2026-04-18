import { IsOptional, IsString } from 'class-validator';

export class CreateMealDto {
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  mealType?: string;

  @IsOptional()
  @IsString()
  loggedAt?: string;
}
