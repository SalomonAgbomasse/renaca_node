import { ApiProperty } from '@nestjs/swagger';

export class QuotationResponseDto {
  @ApiProperty({
    description: 'Indique s\'il y a une erreur',
    example: false
  })
  error: boolean;

  @ApiProperty({
    description: 'Message d\'erreur (si applicable)',
    example: null,
    required: false
  })
  message?: string;

  @ApiProperty({
    description: 'Frais de gestion',
    example: 0
  })
  fm?: number;

  @ApiProperty({
    description: 'Prime de décès',
    example: 4500
  })
  pd?: number;

  @ApiProperty({
    description: 'Prime complémentaire (perte d\'emploi)',
    example: 0
  })
  pc?: number;

  @ApiProperty({
    description: 'Frais d\'accès',
    example: 1000
  })
  acc?: number;

  @ApiProperty({
    description: 'Surprime',
    example: 0
  })
  surp?: number;

  @ApiProperty({
    description: 'Prime totale TTC',
    example: 5500
  })
  puttc?: number;

  @ApiProperty({
    description: 'Options spécifiques pour Obsèques Alafia (OBA)',
    example: null,
    required: false
  })
  obaOptions?: any;

  @ApiProperty({
    description: 'Capital souscrit',
    example: 500000,
    required: false
  })
  capital?: number;
}
