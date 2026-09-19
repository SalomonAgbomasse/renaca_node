import { IsString, IsOptional, IsNumber, IsNotEmpty, IsIn, IsDateString, IsBoolean, Min } from 'class-validator';

export class CreateContractDto {
  @IsNotEmpty()
  @IsNumber()
  idCustomer: number;

  @IsNotEmpty()
  @IsNumber()
  idUser: number;

  @IsNotEmpty()
  @IsNumber()
  idProduct: number;

  @IsOptional()
  @IsString()
  police?: string;

  @IsNotEmpty()
  @IsNumber()
  capital: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  taux?: number;

  @IsNotEmpty()
  @IsDateString()
  dateEff: Date;

  @IsNotEmpty()
  @IsDateString()
  dateEch: Date;

  @IsNotEmpty()
  @IsNumber()
  prime: number;

  @IsNotEmpty()
  @IsNumber()
  commission: number;

  @IsNotEmpty()
  @IsNumber()
  idContractState: number;

  @IsNotEmpty()
  @IsNumber()
  idAgency: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  etablissement?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsNotEmpty()
  @IsNumber()
  createdBy: number;

  @IsOptional()
  @IsNumber()
  updatedBy?: number;

  @IsOptional()
  @IsNumber()
  idBranch?: number;

  @IsOptional()
  @IsNumber()
  idCompany?: number;

  @IsOptional()
  @IsNumber()
  idDepartment?: number;

  @IsOptional()
  @IsNumber()
  idRegion?: number;

  @IsOptional()
  @IsNumber()
  idZone?: number;

  @IsOptional()
  @IsNumber()
  idCountry?: number;

  @IsOptional()
  @IsNumber()
  idCurrency?: number;

  @IsOptional()
  @IsNumber()
  exchangeRate?: number;

  @IsOptional()
  @IsNumber()
  idPaymentMethod?: number;

  @IsOptional()
  @IsNumber()
  idPaymentFrequency?: number;

  @IsOptional()
  @IsDateString()
  nextPaymentDate?: Date;

  @IsOptional()
  @IsDateString()
  lastPaymentDate?: Date;

  @IsOptional()
  @IsNumber()
  totalPaid?: number;

  @IsOptional()
  @IsNumber()
  remainingAmount?: number;

  // Champs des primes d'assurance
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
  @Min(1, { message: 'La prime unique TTC doit être supérieure à 0' })
  puttc?: number;

  // Champs spécifiques aux contrats hors convention
  @IsOptional()
  @IsString()
  garantieCompl?: string;

  @IsOptional()
  obaOptions?: any;

  @IsOptional()
  @IsNumber()
  idNatureCredit?: number;

  @IsOptional()
  @IsDateString()
  dateEch1?: Date;

  @IsOptional()
  @IsBoolean()
  isHorsConvention?: boolean;

  @IsOptional()
  @IsString()
  contractType?: string;

  // Champs PADME spécifiques
  @IsOptional()
  @IsNumber()
  differe?: number; // Durée de différé en mois

  @IsOptional()
  @IsNumber()
  idPeriodicite?: number; // Référence périodicité (1,2,3,4,5,6,12)

  @IsOptional()
  @IsBoolean()
  renouvellementAuto?: boolean;

  @IsOptional()
  @IsString()
  compteBancaire?: string;

  @IsOptional()
  @IsString()
  numeroCompte?: string;

  @IsOptional()
  beneficiaries?: any[];
}
