import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MedicationDto } from './create-profile.dto';

export class UpdateProfileDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  healthFocus?: string[];

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
