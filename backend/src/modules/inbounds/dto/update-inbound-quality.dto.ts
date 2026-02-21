import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsObject,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class UpdateInboundQualityDto {
  @IsUUID()
  locationId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  hmsaPct: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  hmsbPct: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  impPct: number;

  @IsObject()
  @IsOptional()
  specialFindings?: {
    accu?: { present: boolean; kg?: number };
    water?: { present: boolean; liters?: number };
    plastic?: { present: boolean; kg?: number };
    gasTubes?: { present: boolean; count?: number };
    other?: string;
  };

  @IsString()
  @IsOptional()
  qualityNotes?: string;
}
