import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import type { Request } from 'express';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { File } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../../gestionUsers/guards/jwt-auth.guard';
import { AuthInterceptor } from '../interceptors/auth.interceptor';
import { ResponseTransformInterceptor } from '../interceptors/response-transform.interceptor';
import { TicketService } from '../service/ticket.service';
import { TicketNotificationService } from '../service/ticket-notification.service';
import { CreateTicketDto, UpdateTicketDto } from '../dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const ticketFileStorage = diskStorage({
  destination: (req, file, cb) => {
    const ticketId = req.params.id || 'temp';
    const uploadPath = `uploads/tickets/${ticketId}`;
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `screenshot-${uniqueSuffix}${ext}`);
  }
});

@Controller('tickets')
@UseGuards(JwtAuthGuard)
@UseInterceptors(AuthInterceptor, ResponseTransformInterceptor)
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    private readonly ticketNotificationService: TicketNotificationService
  ) {}

  @Post()
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @Req() request: Request
  ): Promise<{ message: string; data: any }> {
    const userId = (request as any)?.user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non identifié');

    console.log('🎫 [TicketController:create] Nouveau ticket reçu', { userId, sujet: createTicketDto.sujet });
    const ticket = await this.ticketService.create(createTicketDto, userId);
    await this.ticketNotificationService.sendNotifications(ticket);
    return { message: 'Ticket créé avec succès', data: ticket };
  }

  @Get()
  async findAll(): Promise<{ message: string; data: any[] }> {
    const tickets = await this.ticketService.findAll();
    return { message: 'Tickets récupérés avec succès', data: tickets };
  }

  @Get('my-tickets')
  async findMyTickets(@Req() request: Request): Promise<{ message: string; data: any[] }> {
    const userId = (request as any).user?.id;
    if (!userId) throw new BadRequestException('Utilisateur non identifié');
    const tickets = await this.ticketService.findAllByUser(userId);
    return { message: 'Vos tickets récupérés avec succès', data: tickets };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() request: Request): Promise<{ message: string; data: any }> {
    if (id === 'my-tickets') return this.findMyTickets(request) as any;
    const ticket = await this.ticketService.findOne(id);
    return { message: 'Ticket récupéré avec succès', data: ticket };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @Req() request: Request
  ): Promise<{ message: string; data: any }> {
    const updatedBy = (request as any).user?.id;
    const ticket = await this.ticketService.update(id, updateTicketDto, updatedBy);
    return { message: 'Ticket mis à jour avec succès', data: ticket };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.ticketService.remove(id);
    return { message: 'Ticket supprimé avec succès' };
  }

  @Post(':id/upload')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: ticketFileStorage,
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'application/pdf'];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Type de fichier non autorisé. Seuls JPEG, PNG, GIF et PDF sont acceptés.'), false);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 }
    })
  )
  async uploadFiles(
    @Param('id') id: string,
    @UploadedFiles() files: File[]
  ): Promise<{ message: string; data: any }> {
    if (!files || files.length === 0) throw new BadRequestException('Aucun fichier fourni');
    const filePaths = files.map(file => `uploads/tickets/${id}/${file.filename}`);
    const ticket = await this.ticketService.addFiles(id, filePaths);
    await this.ticketNotificationService.sendNotifications(ticket);
    return { message: 'Fichiers uploadés avec succès', data: ticket };
  }
}
