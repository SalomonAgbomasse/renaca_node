import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { NatureCredit } from '../entity/nature-credit.entity';
import { User } from '../../gestionUsers/entity/user.entity';

@Injectable()
export class NatureCreditService {
  constructor(
    @InjectRepository(NatureCredit)
    private natureCreditRepository: Repository<NatureCredit>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  findAll(): Promise<NatureCredit[]> {
    return this.natureCreditRepository.find({ where: { isActive: true } });
  }

  async findForUser(user: any): Promise<NatureCredit[]> {
    if (!user) {
      return this.findAll();
    }

    const roleName = (user.role?.libelle || user.role || '').toString().toUpperCase();
    const isAdminOrManager = user.idRole === 1 || user.idRole === 2 || user.idRole === 5 || 
      ['ADMIN', 'MANAGER', 'AGENCY MANAGER', 'AGENCY_MANAGER', 'SUPER ADMIN', 'SUPERADMIN', 'SUPER_ADMIN'].includes(roleName);

    if (isAdminOrManager) {
      return this.natureCreditRepository.find({ where: { isActive: true } });
    }

    // Load user with groups and their nature credits
    const userWithGroups = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['groups', 'groups.natureCredits'],
    });

    const natureCreditMap = new Map<number, NatureCredit>();

    if (userWithGroups && userWithGroups.groups && userWithGroups.groups.length > 0) {
      for (const group of userWithGroups.groups) {
        if (group.isActive && group.natureCredits) {
          for (const nc of group.natureCredits) {
            if (nc.isActive) {
              natureCreditMap.set(nc.id, nc);
            }
          }
        }
      }
    } else {
      // Si l'utilisateur n'appartient à AUCUN groupe, lui attribuer AMORT par défaut
      const amortNature = await this.natureCreditRepository.findOne({
        where: [
          { code: 'AMORT', isActive: true },
          { code: 'AMORTISSABLE', isActive: true },
          { libelle: Like('%AMORTISSABLE%'), isActive: true }
        ]
      });

      if (amortNature) {
        natureCreditMap.set(amortNature.id, amortNature);
      }
    }

    return Array.from(natureCreditMap.values());
  }

  findByCode(code: string): Promise<NatureCredit | null> {
    return this.natureCreditRepository.findOne({ where: { code } });
  }
}