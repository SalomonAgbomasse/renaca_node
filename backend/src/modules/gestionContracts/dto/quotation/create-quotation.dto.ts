import { IsString, IsNumber, IsIn, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuotationDto {
  @ApiProperty({
    description: 'Type d\'assurance',
    example: 'MSFP',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  typeass: string;

  @ApiProperty({
    description: 'Montant du capital (KAL)',
    example: 1000000,
    minimum: 1,
    required: true
  })
  @IsNumber()
  @Min(1)
  @Max(25000000)
  kal: number;

  @ApiProperty({
    description: 'Garantie complémentaire perte d\'emploi',
    example: 'OUI',
    enum: ['OUI', 'NON'],
    required: true
  })
  @IsString()
  @IsIn(['OUI', 'NON'])
  gcompl: string;

  @ApiProperty({
    description: 'Âge de l\'assuré',
    example: 35,
    minimum: 18,
    maximum: 70,
    required: true
  })
  @IsNumber()
  @Min(18)
  @Max(70)
  age: number;

  @ApiProperty({
    description: 'Date de naissance',
    example: '1990-01-01',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  birthdate: string;

  @ApiProperty({
    description: 'Durée en mois',
    example: 24,
    minimum: 1,
    maximum: 60,
    required: true
  })
  @IsNumber()
  @Min(1)
  @Max(60)
  duration: number;
}
