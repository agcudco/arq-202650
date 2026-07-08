import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketDto } from './create-ticket.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ApiPropertyOptional({ example: false, description: 'Estado activo/inactivo' })
  @IsOptional()
  activo?: boolean;

  @ApiPropertyOptional({ example: 4.5, description: 'Valor recaudado' })
  @IsNumber()
  @IsOptional()
  valorRecaudado?: number;
}