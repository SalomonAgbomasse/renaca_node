import { IsString, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  libelle: string;

  @IsNotEmpty()
  @IsString()
  code: string;
}
