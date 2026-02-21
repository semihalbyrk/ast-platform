import { PartialType } from '@nestjs/mapped-types';
import { CreateYardLocationDto } from './create-yard-location.dto';

export class UpdateYardLocationDto extends PartialType(CreateYardLocationDto) {}
