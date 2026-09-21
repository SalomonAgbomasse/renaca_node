import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateCotationDto {

  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  idCustomer: number;

  @IsNotEmpty()
  @IsNumber()
  idNatureCredit: number;

  @IsOptional()
  @IsString()
  idCreditType?: string;

  @IsNotEmpty()
  @IsString()
  typeAss: string;

  @IsNotEmpty()
  @IsNumber()
  capital: number;

  @IsOptional()
  @IsNumber()
  capitalInteret?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  garantieCompl?: string;

  @IsOptional()
  @IsNumber()
  pd?: number;

  @IsOptional()
  @IsNumber()
  pc?: number;

  @IsOptional()
  @IsNumber()
  surp?: number;

  @IsOptional()
  @IsNumber()
  acc?: number;

  @IsOptional()
  @IsNumber()
  fm?: number;

  @IsOptional()
  @IsNumber()
  puttc?: number;

  @IsOptional()
  @IsString()
  lastname?: string;

  @IsOptional()
  @IsString()
  firstname?: string;

  @IsOptional()
  @IsString()
  birthdate?: string;

  @IsOptional()
  @IsNumber()
  idPeriodicite?: number;

  @IsOptional()
  @IsNumber()
  differe?: number;

  @IsOptional()
  @IsString()
  typeContrat?: string;

  @IsOptional()
  @IsString()
  etablissement?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsNumber()
  idUser?: number;

  @IsOptional()
  @IsNumber()
  idAgency?: number;

  // Champs spécifiques RENACA
  @IsOptional()
  @IsNumber()
  tauxSurprime?: number;

  @IsOptional()
  @IsString()
  beneficiaire?: string;
}
