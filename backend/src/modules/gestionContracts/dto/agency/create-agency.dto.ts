import { IsString, IsOptional, IsNumber, IsNotEmpty, IsEmail } from 'class-validator';

export class CreateAgencyDto {
  @IsNotEmpty()
  @IsNumber()
  idSubscriber: number;

  @IsNotEmpty()
  @IsNumber()
  createdBy: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  fax?: string;
}
