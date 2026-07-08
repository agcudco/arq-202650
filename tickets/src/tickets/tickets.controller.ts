import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { TicketResponseDto } from './dto/ticket-response.dto';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  private readonly logger = new Logger(TicketsController.name);
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo ticket' })
  @ApiBody({ type: CreateTicketDto })
  @ApiResponse({
    status: 201,
    description: 'Ticket creado exitosamente',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o validación fallida',
  })
  @ApiResponse({
    status: 404,
    description: 'Persona, vehículo o espacio no encontrado',
  })
  create(@Body() createTicketDto: CreateTicketDto) {
    this.logger.log(`POST /tickets - Creando ticket`);
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los tickets' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tickets',
    type: [TicketResponseDto],
  })
  findAll() {
    this.logger.log('GET /tickets - Listando todos');
    return this.ticketsService.findAll();
  }

  @Get('activos')
  @ApiOperation({ summary: 'Obtener tickets activos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tickets activos',
    type: [TicketResponseDto],
  })
  findActivos() {
    this.logger.log('GET /tickets/activos - Listando activos');
    return this.ticketsService.findActivos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un ticket por ID' })
  @ApiParam({ name: 'id', description: 'UUID del ticket' })
  @ApiResponse({
    status: 200,
    description: 'Ticket encontrado',
    type: TicketResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  findOne(@Param('id') id: string) {
    this.logger.log(`GET /tickets/${id} - Buscando ticket`);
    return this.ticketsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cerrar un ticket (actualizar estado a inactivo)' })
  @ApiParam({ name: 'id', description: 'UUID del ticket' })
  @ApiBody({ type: UpdateTicketDto })
  @ApiResponse({
    status: 200,
    description: 'Ticket cerrado exitosamente',
    type: TicketResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  @ApiResponse({ status: 400, description: 'El ticket ya está cerrado' })
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    this.logger.log(`PATCH /tickets/${id} - Cerrando ticket`);
    return this.ticketsService.cerrarTicket(id, updateTicketDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un ticket (físicamente)' })
  @ApiParam({ name: 'id', description: 'UUID del ticket' })
  @ApiResponse({ status: 204, description: 'Ticket eliminado' })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  async remove(@Param('id') id: string) {
    this.logger.log(`DELETE /tickets/${id} - Eliminando ticket`);
    await this.ticketsService.remove(id);
  }
}
