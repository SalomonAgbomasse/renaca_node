import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entity/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      order: { id: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { id } });
  }

  async findByLibelle(libelle: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { libelle } });
  }

  async findByCode(code: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { code } });
  }

  async create(roleData: any): Promise<Role> {
    const data: any = { ...roleData };
    if (data.title && !data.libelle) {
      data.libelle = data.title;
      delete data.title;
    }
    if (data.libelle) {
      data.libelle = data.libelle.trim().toUpperCase();
    }
    if (data.code) {
      data.code = data.code.trim().toUpperCase();
    }
    delete data.permissions;
    const role = this.roleRepository.create(data as Partial<Role>);
    return this.roleRepository.save(role);
  }

  async update(id: number, roleData: any): Promise<Role | null> {
    const data: any = { ...roleData };
    if (data.title && !data.libelle) {
      data.libelle = data.title;
      delete data.title;
    }
    if (data.libelle) {
      data.libelle = data.libelle.trim().toUpperCase();
    }
    if (data.code) {
      data.code = data.code.trim().toUpperCase();
    }
    delete data.permissions;
    await this.roleRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.roleRepository.delete(id);
  }
}
