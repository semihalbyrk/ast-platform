import { IsString, IsInt, IsIn, IsDateString, Min } from 'class-validator';

export class RecordWeightDto {
  @IsString()
  weegbonNr: string;

  @IsInt()
  @Min(1)
  weightKg: number;

  @IsInt()
  @IsIn([1, 2])
  weighingNumber: 1 | 2;

  @IsDateString()
  timestamp: string;
}
