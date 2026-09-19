import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTypeCustomerDto {
  @IsNotEmpty()
  @IsString()
  libelle: string;

  @IsOptional()
  @IsString()
  description?: string;
}
