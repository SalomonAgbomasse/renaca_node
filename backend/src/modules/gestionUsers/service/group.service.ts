import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Group } from '../entity/group.entity';
import { User } from '../entity/user.entity';
import { NatureCredit } from '../../gestionContracts/entity/nature-credit.entity';
import { CreateGroupDto, UpdateGroupDto } from '../dto';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(NatureCredit)
    private natureCreditRepository: Repository<NatureCredit>,
  ) {}

  async findAll(): Promise<Group[]> {
    return this.groupRepository.find({
      relations: ['natureCredits', 'users'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['natureCredits', 'users'],
    });
    if (!group) {
      throw new NotFoundException(`Groupe #${id} non trouvé`);
    }
    return group;
  }

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    const group = this.groupRepository.create({
      libelle: createGroupDto.libelle,
      code: createGroupDto.code,
      description: createGroupDto.description,
      isActive: createGroupDto.isActive !== undefined ? createGroupDto.isActive : true,
    });

    if (createGroupDto.natureCreditIds && createGroupDto.natureCreditIds.length > 0) {
      group.natureCredits = await this.natureCreditRepository.findBy({
        id: In(createGroupDto.natureCreditIds),
      });
    } else {
      group.natureCredits = [];
    }

    if (createGroupDto.userIds && createGroupDto.userIds.length > 0) {
      group.users = await this.userRepository.findBy({
        id: In(createGroupDto.userIds),
      });
    } else {
      group.users = [];
    }

    return this.groupRepository.save(group);
  }

  async update(id: number, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);

    if (updateGroupDto.libelle !== undefined) group.libelle = updateGroupDto.libelle;
    if (updateGroupDto.code !== undefined) group.code = updateGroupDto.code;
    if (updateGroupDto.description !== undefined) group.description = updateGroupDto.description;
    if (updateGroupDto.isActive !== undefined) group.isActive = updateGroupDto.isActive;

    if (updateGroupDto.natureCreditIds !== undefined) {
      if (updateGroupDto.natureCreditIds.length > 0) {
        group.natureCredits = await this.natureCreditRepository.findBy({
          id: In(updateGroupDto.natureCreditIds),
        });
      } else {
        group.natureCredits = [];
      }
    }

    if (updateGroupDto.userIds !== undefined) {
      if (updateGroupDto.userIds.length > 0) {
        group.users = await this.userRepository.findBy({
          id: In(updateGroupDto.userIds),
        });
      } else {
        group.users = [];
      }
    }

    return this.groupRepository.save(group);
  }

  async remove(id: number): Promise<void> {
    const group = await this.findOne(id);
    await this.groupRepository.softRemove(group);
  }
}
