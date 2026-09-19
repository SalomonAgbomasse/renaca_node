import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { ContractStateService } from '../service/contract-state.service';
import { ContractState } from '../entity/contract-state.entity';
import { CreateContractStateDto, UpdateContractStateDto } from '../dto';
import { ContractAuthGuard, RequirePermissions, ContractPermission } from '../guards/contract-auth.guard';
import { JwtAuthGuard } from '../../gestionUsers/guards/jwt-auth.guard';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';

@Controller('contract-states')
@UseGuards(JwtAuthGuard, ContractAuthGuard)
@UseInterceptors(AuthInterceptor, ResponseTransformInterceptor)
export class ContractStateController {
  constructor(private readonly contractStateService: ContractStateService) {}

  @Get()
  @RequirePermissions(ContractPermission.READ)
  async findAll(): Promise<{ message: string; contractStates: ContractState[] }> {
    const contractStates = await this.contractStateService.findAll();
    return {
      message: `Liste des ${contractStates.length} états de contrat récupérée avec succès`,
      contractStates
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; contractState: ContractState }> {
    const contractState = await this.contractStateService.findOne(id);
    if (!contractState) {
      throw new NotFoundException('État de contrat non trouvé');
    }
    return {
      message: `État de contrat "${contractState.libelle}" récupéré avec succès`,
      contractState
    };
  }

  @Get('search/libelle')
  async findByLibelle(@Query('libelle') libelle: string): Promise<{ message: string; contractState: ContractState | null }> {
    const contractState = await this.contractStateService.findByLibelle(libelle);
    if (!contractState) {
      return {
        message: `Aucun état de contrat trouvé avec le libellé "${libelle}"`,
        contractState: null
      };
    }
    return {
      message: `État de contrat trouvé avec le libellé "${libelle}"`,
      contractState
    };
  }

  @Post()
  @RequirePermissions(ContractPermission.MANAGE_CONTRACT_STATE)
  async create(@Body() contractStateData: CreateContractStateDto): Promise<{ message: string; contractState: ContractState }> {
    const contractState = await this.contractStateService.create(contractStateData);
    return {
      message: `État de contrat "${contractState.libelle}" créé avec succès`,
      contractState
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() contractStateData: UpdateContractStateDto,
  ): Promise<{ message: string; contractState: ContractState }> {
    const contractState = await this.contractStateService.update(id, contractStateData);
    if (!contractState) {
      throw new NotFoundException('État de contrat non trouvé');
    }
    return {
      message: `État de contrat "${contractState.libelle}" mis à jour avec succès`,
      contractState
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; contractStateId: number }> {
    const contractState = await this.contractStateService.findOne(id);
    if (!contractState) {
      throw new NotFoundException('État de contrat non trouvé');
    }
    
    await this.contractStateService.remove(id);
    return {
      message: `État de contrat "${contractState.libelle}" supprimé avec succès`,
      contractStateId: id
    };
  }

  // Routes personnalisées
  @Get('statistics/summary')
  async getContractStateStatistics(): Promise<{ message: string; statistics: any }> {
    const contractStates = await this.contractStateService.findAll();
    
    const statistics = {
      totalContractStates: contractStates.length,
      activeContractStates: contractStates.filter(cs => cs.isActive !== false).length,
      statesByType: {
        pending: contractStates.filter(cs => cs.libelle === 'PENDING').length,
        active: contractStates.filter(cs => cs.libelle === 'ACTIVE').length,
        expired: contractStates.filter(cs => cs.libelle === 'EXPIRED').length,
        cancelled: contractStates.filter(cs => cs.libelle === 'CANCELLED').length
      }
    };
    
    return {
      message: 'Statistiques des états de contrat récupérées avec succès',
      statistics
    };
  }

  // Obtenir les contrats d'un état spécifique
  @Get(':id/contracts')
  async getContractsByState(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; contracts: any[] }> {
    const contractState = await this.contractStateService.findOne(id);
    if (!contractState) {
      throw new NotFoundException('État de contrat non trouvé');
    }

    // Ici vous pourriez appeler un service pour récupérer les contrats de cet état
    // Pour l'instant, on retourne des données simulées
    const contracts = [
      {
        id: 1,
        reference: 'CON-001',
        police: 'POL-001',
        customer: 'Jean Dupont',
        dateEff: new Date(),
        dateEch: new Date(),
        capital: 100000
      }
    ];

    return {
      message: `Contrats avec l'état "${contractState.libelle}" récupérés avec succès`,
      contracts
    };
  }

  // Obtenir les transitions possibles d'un état
  @Get(':id/transitions')
  async getPossibleTransitions(@Param('id', ParseIntPipe) id: number): Promise<{ message: string; transitions: any[] }> {
    const contractState = await this.contractStateService.findOne(id);
    if (!contractState) {
      throw new NotFoundException('État de contrat non trouvé');
    }

    // Ici vous pourriez implémenter la logique des transitions d'état
    // Pour l'instant, on retourne des données simulées
    let transitions: any[] = [];
    
    switch (contractState.libelle) {
      case 'PENDING':
        transitions = [
          { to: 'ACTIVE', action: 'Activer', description: 'Activer le contrat' },
          { to: 'CANCELLED', action: 'Annuler', description: 'Annuler le contrat' }
        ];
        break;
      case 'ACTIVE':
        transitions = [
          { to: 'EXPIRED', action: 'Expirer', description: 'Marquer comme expiré' },
          { to: 'CANCELLED', action: 'Annuler', description: 'Annuler le contrat' }
        ];
        break;
      default:
        transitions = [];
    }

    return {
      message: `Transitions possibles pour l'état "${contractState.libelle}" récupérées avec succès`,
      transitions
    };
  }
}
