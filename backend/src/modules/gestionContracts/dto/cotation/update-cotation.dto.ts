import { PartialType } from '@nestjs/mapped-types';
import { CreateCotationDto } from './create-cotation.dto';

export class UpdateCotationDto extends PartialType(CreateCotationDto) {}
