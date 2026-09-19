import { Controller, Get, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { PeriodiciteSeedService } from '../service/periodicite-seed.service';
import { PeriodiciteService } from '../service/periodicite.service';
import { JwtAuthGuard } from '../../gestionUsers/guards/jwt-auth.guard';
import { ContractAuthGuard } from '../guards/contract-auth.guard';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';

@Controller('periodicite')
@UseGuards(JwtAuthGuard, ContractAuthGuard)
@UseInterceptors(ResponseTransformInterceptor)
export class PeriodiciteController {
  constructor(
    private readonly periodiciteSeedService: PeriodiciteSeedService,
    private readonly periodiciteService: PeriodiciteService,
  ) {}

  @Get()
  async findAll() {
    const periodicites = await this.periodiciteService.findAll();
    return {
      message: `Liste des ${periodicites.length} périodicités récupérée avec succès`,
      data: periodicites
    };
  }

  @Post('seed')
  async seed(): Promise<{ message: string }> {
    await this.periodiciteSeedService.seed();
    return { message: 'Périodicités PADME créées avec succès' };
  }
}
