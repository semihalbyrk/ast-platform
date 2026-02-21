import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateInboundWeighOutDto {
  @IsInt()
  @Min(1)
  tareWeight: number;

  @IsString()
  @IsOptional()
  qualityNotes?: string;
}
