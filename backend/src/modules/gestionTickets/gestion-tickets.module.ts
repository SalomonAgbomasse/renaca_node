import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GestionUsersModule } from '../gestionUsers/gestion-users.module';
import { TicketController } from './controller/ticket.controller';
import { TicketService } from './service/ticket.service';
import { TicketNotificationService } from './service/ticket-notification.service';
import { Ticket } from './entity/ticket.entity';
import { EmailService } from '../../services/email.service';
import { SmsService } from '../../services/sms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ticket]),
    GestionUsersModule
  ],
  controllers: [TicketController],
  providers: [
    TicketService,
    TicketNotificationService,
    EmailService,
    SmsService,
  ],
  exports: [TicketService, TicketNotificationService]
})
export class GestionTicketsModule {}
