import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  activo!: boolean;

  @IsNumber()
  @IsOptional()
  valorRecaudado?: number;
}
