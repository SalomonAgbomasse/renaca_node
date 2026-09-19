import { IsString, IsOptional, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateRoleDto {
  @IsOptional()
  @IsNumber()
  idPermision?: number;

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
