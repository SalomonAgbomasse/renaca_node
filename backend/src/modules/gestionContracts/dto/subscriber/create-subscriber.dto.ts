import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSubscriberDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  fax: string;

  @IsOptional()
  @IsString()
  other?: string;
}
