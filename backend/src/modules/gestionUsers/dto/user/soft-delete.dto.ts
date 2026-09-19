import { IsNumber, IsNotEmpty } from 'class-validator';

export class SoftDeleteDto {
  @IsNumber()
  @IsNotEmpty()
  deletedBy: number;
}
