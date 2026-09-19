import { IsString, IsOptional, IsNumber, IsNotEmpty, IsEmail, IsIn, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsNumber()
  idRole: number;

  @IsOptional()
  @IsNumber()
  idAgency?: number;

  @IsOptional()
  @IsNumber()
  idOffice?: number;

  @IsNotEmpty()
  @IsString()
  lastname: string;

  @IsNotEmpty()
  @IsString()
  firstname: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  birthdate?: string;

  @IsOptional()
  @IsIn(['M', 'F'])
  gender?: string;

  @IsOptional()
  @IsString()
  fonction?: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  salt?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsNumber()
  version?: number;

  @IsOptional()
  @IsIn(['ACTIVE', 'DESACTIVE'])
  status?: string;

  @IsOptional()
  @IsString()
  smsToken?: string;

  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean;
}
