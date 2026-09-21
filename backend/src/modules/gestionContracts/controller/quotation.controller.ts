import { Controller, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { QuotationService } from '../service/quotation.service';
import { QuotationResponseDto } from '../dto/quotation/quotation-response.dto';
import { JwtAuthGuard } from '../../gestionUsers/guards/jwt-auth.guard';
import { UserAuthGuard } from '../../gestionUsers/guards/user-auth.guard';
import { UserAuthInterceptor } from '../../gestionUsers/interceptors/user-auth.interceptor';
import { ResponseTransformInterceptor } from '../../gestionUsers/interceptors/response-transform.interceptor';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Quotation')
@Controller('quotation')
@UseInterceptors(ResponseTransformInterceptor)
@UseGuards(JwtAuthGuard, UserAuthGuard)
@UseInterceptors(UserAuthInterceptor)
@ApiBearerAuth()
export class QuotationController {
  constructor(private readonly quotationService: QuotationService) {}

  @Post('calculate-renaca')
  @ApiOperation({ summary: 'Calculer une prime RENACA (Amortissable ou Constant)' })
  @ApiResponse({
    status: 200,
    description: 'Prime RENACA calculée avec succès',
    type: QuotationResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Erreur dans les paramètres de la quotation'
  })
  async calculateRenaca(
    @Body() body: {
      typeCapital: 'AMORT' | 'CONST';
      birthdate: string;
      duration: number;
      capital: number;
      perteEmploi?: boolean;
      tauxSurprime?: number;
    }
  ): Promise<QuotationResponseDto> {
    return this.quotationService.primeRENACA(
      body.typeCapital,
      body.capital,
      body.birthdate,
      body.duration,
      body.perteEmploi,
      body.tauxSurprime
    );
  }
}
