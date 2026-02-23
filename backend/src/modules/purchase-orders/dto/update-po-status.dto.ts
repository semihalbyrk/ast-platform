import { IsEnum } from 'class-validator';
import { POStatus } from '../../../common/enums';

export class UpdatePOStatusDto {
  @IsEnum(POStatus)
  status: POStatus;
}
