import { Controller, Post, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { QuotationService } from '../service/quotation.service';
import { CreateQuotationDto } from '../dto/quotation/create-quotation.dto';
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


  // PADME — route retirée (moteur de calcul commenté dans QuotationService).
  // @Post('calculate-biic')
  // @ApiOperation({ summary: 'Calculer une quotation BIIC' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Quotation BIIC calculée avec succès',
  //   type: QuotationResponseDto
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Erreur dans les paramètres de la quotation'
  // })
  // async calculateBIIC(
  //   @Body() body: {
  //     birthdate: string;
  //     typeass: number;
  //     gcompl: string;
  //     typecredit: string;
  //     duration: number;
  //     kal: number;
  //     idPeriodicite: number;
  //     differe: number;
  //   }
  // ): Promise<QuotationResponseDto> {
  //   const creditType = body.typecredit || 'AMORT';
  //   const isCPorOBA = creditType === 'CP' || creditType === 'OBA';
  //   const periodicite = isCPorOBA ? 12 : body.idPeriodicite;
  //   const differe = isCPorOBA ? 0 : body.differe;
  //
  //   const result = await this.quotationService.primePADME(
  //     body.kal,
  //     body.birthdate,
  //     body.duration,
  //     periodicite,
  //     new Date().toISOString().split('T')[0],
  //     differe,
  //     creditType,
  //     (body as any).obaOptions
  //   );
  //
  //   return result;
  // }

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
