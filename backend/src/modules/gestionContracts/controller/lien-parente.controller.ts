import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { LienParenteService } from '../service/lien-parente.service';
import { LienParente } from '../entity/lien-parente.entity';
import { JwtAuthGuard } from 'src/modules/gestionUsers/guards/jwt-auth.guard';
import { ContractAuthGuard } from '../guards/contract-auth.guard';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';

@Controller('lien-parente')
@UseGuards(JwtAuthGuard, ContractAuthGuard)
@UseInterceptors(AuthInterceptor, ResponseTransformInterceptor)
export class LienParenteController {
  constructor(private readonly lienParenteService: LienParenteService) {}

  @Get()
  async findAll(): Promise<{ message: string; liensParente: LienParente[] }> {
    const liensParente = await this.lienParenteService.findAll();
    return {
      message: `Liste des ${liensParente.length} liens de parenté récupérée avec succès`,
      liensParente,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; lienParente: LienParente }> {
    const lienParente = await this.lienParenteService.findOne(id);
    if (!lienParente) {
      throw new NotFoundException('Lien de parenté non trouvé');
    }
    return {
      message: `Lien de parenté "${lienParente.libelle}" récupéré avec succès`,
      lienParente,
    };
  }

  @Post()
  async create(@Body() data: Partial<LienParente>): Promise<{ message: string; lienParente: LienParente }> {
    const lienParente = await this.lienParenteService.create(data);
    return {
      message: `Lien de parenté "${lienParente.libelle}" créé avec succès`,
      lienParente,
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<LienParente>,
  ): Promise<{ message: string; lienParente: LienParente }> {
    const lienParente = await this.lienParenteService.update(id, data);
    if (!lienParente) {
      throw new NotFoundException('Lien de parenté non trouvé');
    }
    return {
      message: `Lien de parenté "${lienParente.libelle}" mis à jour avec succès`,
      lienParente,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; id: number }> {
    const lienParente = await this.lienParenteService.findOne(id);
    if (!lienParente) {
      throw new NotFoundException('Lien de parenté non trouvé');
    }
    await this.lienParenteService.remove(id);
    return {
      message: `Lien de parenté "${lienParente.libelle}" supprimé avec succès`,
      id,
    };
  }

  @Post('seed')
  async seed(): Promise<{ message: string }> {
    await this.lienParenteService.seedDefaults();
    return { message: 'Liens de parenté initialisés avec succès' };
  }
}
