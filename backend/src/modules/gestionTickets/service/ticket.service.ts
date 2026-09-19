import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Ticket, TicketStatus, TicketPriority } from '../entity/ticket.entity';
import { CreateTicketDto, UpdateTicketDto } from '../dto';
import { UserService } from '../../gestionUsers/service/user.service';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly userService: UserService
  ) {}

  async create(createTicketDto: CreateTicketDto, userId: number): Promise<Ticket> {
    const ticket = this.ticketRepository.create({
      ...createTicketDto,
      idUser: userId,
      status: TicketStatus.OUVERT,
      priority: createTicketDto.priority || TicketPriority.NORMALE
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    return await this.ticketRepository.findOne({
      where: { id: savedTicket.id },
      relations: ['user', 'user.role', 'user.agency']
    }) || savedTicket;
  }

  async findAll(): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { deletedAt: IsNull() },
      relations: ['user', 'assignedUser', 'reponduParUser', 'user.role', 'user.agency'],
      order: { createdAt: 'DESC' }
    });
  }

  async findAllByUser(userId: number): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { idUser: userId, deletedAt: IsNull() },
      relations: ['user', 'assignedUser', 'reponduParUser'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['user', 'assignedUser', 'reponduParUser', 'user.role', 'user.agency']
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket avec l'ID ${id} non trouvé`);
    }

    return ticket;
  }

  async update(id: number, updateTicketDto: UpdateTicketDto, updatedBy?: number): Promise<Ticket> {
    const ticket = await this.findOne(id);

    if (updateTicketDto.status) ticket.status = updateTicketDto.status;
    if (updateTicketDto.priority) ticket.priority = updateTicketDto.priority;
    if (updateTicketDto.assignedTo !== undefined) ticket.assignedTo = updateTicketDto.assignedTo;

    if (updateTicketDto.reponse) {
      ticket.reponse = updateTicketDto.reponse;
      if (updatedBy) ticket.reponduPar = updatedBy;
      ticket.dateReponse = new Date();
      if (ticket.status !== TicketStatus.RESOLU && ticket.status !== TicketStatus.FERME) {
        ticket.status = TicketStatus.RESOLU;
      }
    }

    return this.ticketRepository.save(ticket);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.ticketRepository.softDelete(id);
  }

  async addFiles(id: number, files: string[]): Promise<Ticket> {
    const ticket = await this.findOne(id);

    let existingFiles: string[] = [];
    if (ticket.fichiers) {
      try {
        existingFiles = JSON.parse(ticket.fichiers);
      } catch (e) {
        existingFiles = [];
      }
    }

    existingFiles.push(...files);
    ticket.fichiers = JSON.stringify(existingFiles);
    const savedTicket = await this.ticketRepository.save(ticket);

    return await this.ticketRepository.findOne({
      where: { id: savedTicket.id },
      relations: ['user', 'assignedUser', 'reponduParUser', 'user.role', 'user.agency']
    }) || savedTicket;
  }

  async getAdminUsers(): Promise<Array<{ id: number; email: string; phone: string; firstname: string; lastname: string }>> {
    const result = await this.userService.findAll();
    const allUsers = Array.isArray(result) ? result : (result as any).users ?? [];

    return allUsers
      .filter((user: any) => {
        const roleLibelle = user.role?.libelle?.toUpperCase() || '';
        const idRole = user.idRole;
        return roleLibelle === 'ADMIN' || roleLibelle === 'SUPER ADMIN' || idRole === 1 || idRole === 5;
      })
      .map((user: any) => ({
        id: user.id,
        email: user.email || '',
        phone: user.phone || '',
        firstname: user.firstname,
        lastname: user.lastname
      }))
      .filter((user: any) => user.email || user.phone);
  }
}
