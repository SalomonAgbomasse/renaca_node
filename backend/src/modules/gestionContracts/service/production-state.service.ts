import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductionState } from '../entity/production-state.entity';

@Injectable()
export class ProductionStateService {
  constructor(
    @InjectRepository(ProductionState)
    private readonly productionStateRepository: Repository<ProductionState>
  ) {}

  async findAll(): Promise<ProductionState[]> {
    return await this.productionStateRepository.find({
      relations: ['agency', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<ProductionState | null> {
    return await this.productionStateRepository.findOne({
      where: { id },
      relations: ['agency', 'user']
    });
  }

  async findByCode(code: string): Promise<ProductionState | null> {
    return await this.productionStateRepository.findOne({
      where: { code },
      relations: ['agency', 'user']
    });
  }

  async create(productionStateData: any): Promise<ProductionState> {
    const now = new Date();
    const code = `PROD-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-3)}`;
    
    const newState = this.productionStateRepository.create({
      code,
      idAgency: productionStateData.idAgency || null, // null pour toutes les agences
      startDate: productionStateData.startDate,
      endDate: productionStateData.endDate,
      generatedBy: productionStateData.generatedBy || 1,
      status: productionStateData.status || 'pending'
    });
    
    const savedState = await this.productionStateRepository.save(newState);
    console.log('📊 État de production créé:', savedState);
    
    
    return savedState;
  }

  async update(id: number, productionStateData: any): Promise<ProductionState | null> {
    const existingState = await this.findOne(id);
    if (!existingState) return null;
    
    Object.assign(existingState, productionStateData);
    const updatedState = await this.productionStateRepository.save(existingState);
    
    console.log('📊 État de production mis à jour:', updatedState);
    return updatedState;
  }

  async remove(id: number): Promise<void> {
    await this.productionStateRepository.softDelete(id);
    console.log('📊 État de production supprimé (soft delete):', id);
  }

  async findByAgencyAndPeriod(idAgency: number | null, startDate: string, endDate: string): Promise<ProductionState[]> {
    const whereCondition: any = {
      startDate,
      endDate
    };
    
    // Si idAgency est null, ne pas filtrer par agence (toutes les agences)
    if (idAgency !== null) {
      whereCondition.idAgency = idAgency;
    }
    
    return await this.productionStateRepository.find({
      where: whereCondition,
      relations: ['agency', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByStatus(status: string): Promise<ProductionState[]> {
    return await this.productionStateRepository.find({
      where: { status: status as any },
      relations: ['agency', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findWithFilters(filters: any, page: number = 1, limit: number = 15): Promise<{ data: ProductionState[]; total: number; page: number; limit: number; totalPages: number }> {
    // Nettoyer les paramètres de recherche
    if (filters.search) {
      filters.search = filters.search.replace(/\/$/, ''); // Supprimer le / à la fin
      console.log('🔍 Service - Terme de recherche nettoyé:', filters.search);
    }
    
    const queryBuilder = this.productionStateRepository.createQueryBuilder('production_state')
      .leftJoinAndSelect('production_state.agency', 'agency')
      .leftJoinAndSelect('production_state.user', 'user')
      .orderBy('production_state.createdAt', 'DESC');

    // Filtres disponibles (tous les champs de la table sauf summary et actions)
    if (filters.id) {
      queryBuilder.andWhere('production_state.id = :id', { id: filters.id });
    }

    if (filters.code) {
      queryBuilder.andWhere('production_state.code LIKE :code', { code: `%${filters.code}%` });
    }

    if (filters.idAgency !== undefined && filters.idAgency !== null) {
      queryBuilder.andWhere('production_state.idAgency = :idAgency', { idAgency: filters.idAgency });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('production_state.startDate = :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('production_state.endDate = :endDate', { endDate: filters.endDate });
    }

    if (filters.generatedBy) {
      queryBuilder.andWhere('production_state.generatedBy = :generatedBy', { generatedBy: filters.generatedBy });
    }

    if (filters.status) {
      queryBuilder.andWhere('production_state.status = :status', { status: filters.status });
    }

    if (filters.errorMessage) {
      queryBuilder.andWhere('production_state.errorMessage LIKE :errorMessage', { errorMessage: `%${filters.errorMessage}%` });
    }

    if (filters.filePath) {
      queryBuilder.andWhere('production_state.filePath LIKE :filePath', { filePath: `%${filters.filePath}%` });
    }

    if (filters.createdAt) {
      queryBuilder.andWhere('DATE(production_state.createdAt) = :createdAt', { createdAt: filters.createdAt });
    }

    if (filters.updatedAt) {
      queryBuilder.andWhere('DATE(production_state.updatedAt) = :updatedAt', { updatedAt: filters.updatedAt });
    }

    // Filtres sur les relations
    if (filters.agencyName) {
      queryBuilder.andWhere('agency.name LIKE :agencyName', { agencyName: `%${filters.agencyName}%` });
    }

    if (filters.userName) {
      queryBuilder.andWhere('(user.firstname LIKE :userName OR user.lastname LIKE :userName)', { userName: `%${filters.userName}%` });
    }

    if (filters.userEmail) {
      queryBuilder.andWhere('user.email LIKE :userEmail', { userEmail: `%${filters.userEmail}%` });
    }

    // Recherche globale (recherche dans tous les champs textuels)
    if (filters.search) {
      queryBuilder.andWhere(
        '(production_state.code LIKE :search OR ' +
        'production_state.errorMessage LIKE :search OR ' +
        'production_state.filePath LIKE :search OR ' +
        'agency.name LIKE :search OR ' +
        'user.firstname LIKE :search OR ' +
        'user.lastname LIKE :search OR ' +
        'user.email LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Pagination
    const total = await queryBuilder.getCount();
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const data = await queryBuilder
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages
    };
  }

}
