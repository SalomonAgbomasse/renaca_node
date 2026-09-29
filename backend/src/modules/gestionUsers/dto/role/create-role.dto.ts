import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateRoleDto {
  @IsOptional()
  @IsNumber()
  idPermision?: number;

  @IsOptional()
  @IsString()
  code?: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  desc: string;

  @IsOptional()
  @IsString()
  other?: string;
}
