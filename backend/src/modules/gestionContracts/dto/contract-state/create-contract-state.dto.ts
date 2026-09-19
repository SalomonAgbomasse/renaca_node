import { IsString, IsNotEmpty } from 'class-validator';

export class CreateContractStateDto {
  @IsNotEmpty()
  @IsString()
  libelle: string;
}
