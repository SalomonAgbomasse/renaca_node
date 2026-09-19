import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, MaxLength } from 'class-validator';
import { TicketPriority } from '../entity/ticket.entity';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sujet: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  telephone?: string;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;
}
