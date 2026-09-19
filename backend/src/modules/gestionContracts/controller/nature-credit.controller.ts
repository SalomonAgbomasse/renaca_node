import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { NatureCreditService } from '../service/nature-credit.service';
import { ContractAuthGuard } from '../guards/contract-auth.guard';
import { JwtAuthGuard } from '../../gestionUsers/guards/jwt-auth.guard';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';

@Controller('nature-credits')
@UseGuards(JwtAuthGuard, ContractAuthGuard)
@UseInterceptors(ResponseTransformInterceptor)
export class NatureCreditController {
  constructor(private readonly natureCreditService: NatureCreditService) {}

  @Get()
  async findAll() {
    const natureCredits = await this.natureCreditService.findAll();
    return {
      message: 'Liste des natures de crédit récupérée avec succès',
      data: natureCredits
    };
  }
}
