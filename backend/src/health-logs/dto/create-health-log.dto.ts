import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateHealthLogDto {
  @IsOptional()
  @IsString()
  loggedAt?: string;

  @IsOptional()
  @IsNumber()
  systolic?: number;

  @IsOptional()
  @IsNumber()
  diastolic?: number;

  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  glycemia?: number;

  @IsOptional()
  @IsNumber()
  proteinuria?: number;

  @IsOptional()
  @IsNumber()
  ferritin?: number;

  @IsOptional()
  @IsNumber()
  crp?: number;

  @IsOptional()
  @IsNumber()
  tsh?: number;

  @IsOptional()
  @IsNumber()
  hba1c?: number;

  @IsOptional()
  @IsNumber()
  ldl?: number;

  @IsOptional()
  @IsNumber()
  medicationLevel?: number;

  @IsOptional()
  @IsBoolean()
  hasEdema?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicationsTaken?: string[];

  @IsOptional()
  @IsBoolean()
  isPeriodStart?: boolean;

  @IsOptional()
  @IsNumber()
  hydrationLiters?: number;
}
