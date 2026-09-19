import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { TicketStatus, TicketPriority } from '../entity/ticket.entity';

export class UpdateTicketDto {
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsInt()
  @IsOptional()
  assignedTo?: number;

  @IsString()
  @IsOptional()
  reponse?: string;
}
