import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MedicationDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  dosage?: string;
}

export class CreateProfileDto {
  @IsArray()
  @IsString({ each: true })
  healthFocus: string[];

  @IsOptional()
  @IsNumber()
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lovedFoods?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hatedFoods?: string[];

  @IsOptional()
  @IsString()
  medicalContext?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  medications?: MedicationDto[];

  @IsOptional()
  @IsBoolean()
  cycleEnabled?: boolean;

  @IsOptional()
  @IsString()
  lastPeriodStart?: string;
}
