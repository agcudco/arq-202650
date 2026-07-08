import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { ConfigService } from '@nestjs/config';
import { Persona } from './interfaces/persona.interface';
import { Vehiculo } from './interfaces/vehiculo.interface';
import { Espacio } from './interfaces/espacio.interface';
import { UserResponse } from './interfaces/user-response.interface';
import { HttpClientService } from './common/httpl-client.service';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);
  private readonly personaUrl: string;
  private readonly espacioUrl: string;
  private readonly vehiculoUrl: string;
  private readonly tarifaPorHora: number;

  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    private httpClient: HttpClientService,
    private configService: ConfigService,
  ) {
    this.personaUrl = this.configService.get('PERSONA_URL')!;
    this.espacioUrl = this.configService.get('ESPACIO_URL')!;
    this.vehiculoUrl = this.configService.get('VEHICULO_URL')!;
    this.tarifaPorHora = this.configService.get('TARIFA_POR_HORA', 1.5);
    this.logger.log('🚀 Servicio de tickets inicializado');
    this.logger.debug(`PERSONA_URL: ${this.personaUrl}`);
    this.logger.debug(`ESPACIO_URL: ${this.espacioUrl}`);
    this.logger.debug(`VEHICULO_URL: ${this.vehiculoUrl}`);
    this.logger.debug(`TARIFA_POR_HORA: ${this.tarifaPorHora}`);
  }

  /**
   * Crear un nuevo ticket de estacionamiento
   */
  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    this.logger.log(`📝 Creando ticket para placa ${createTicketDto.placa}`);

    // 1. Validar persona
    this.logger.debug(`🔍 Validando persona con DNI ${createTicketDto.dni}`);
    const persona = await this.validarPersona(createTicketDto.dni);
    if (!persona) {
      this.logger.warn(
        `❌ Persona con DNI ${createTicketDto.dni} no encontrada`,
      );
      throw new BadRequestException(
        `Persona con DNI ${createTicketDto.dni} no encontrada`,
      );
    }
    this.logger.debug(
      `✅ Persona encontrada: ${persona.nombre} ${persona.apellido}`,
    );

    // 2. Validar vehículo
    this.logger.debug(
      `🔍 Validando vehículo con placa ${createTicketDto.placa}`,
    );
    const vehiculo = await this.validarPlaca(createTicketDto.placa);
    if (!vehiculo) {
      this.logger.warn(
        `❌ Vehículo con placa ${createTicketDto.placa} no encontrado`,
      );
      throw new BadRequestException(
        `Vehículo con placa ${createTicketDto.placa} no encontrado`,
      );
    }
    this.logger.debug(
      `✅ Vehículo encontrado: ${vehiculo.marca} ${vehiculo.modelo}`,
    );

    // 3. Obtener y validar el espacio
    this.logger.debug(`🔍 Obteniendo espacio ${createTicketDto.idEspacio}`);
    const espacio = await this.obtenerEspacio(createTicketDto.idEspacio);
    if (!espacio) {
      this.logger.warn(`❌ Espacio ${createTicketDto.idEspacio} no existe`);
      throw new BadRequestException(
        `Espacio ${createTicketDto.idEspacio} no existe`,
      );
    }
    if (espacio.estado !== 'DISPONIBLE') {
      this.logger.warn(
        `❌ Espacio ${createTicketDto.idEspacio} no está disponible (estado: ${espacio.estado})`,
      );
      throw new BadRequestException(
        `El espacio ${createTicketDto.idEspacio} no está disponible`,
      );
    }
    this.logger.debug(
      `✅ Espacio disponible: ${espacio.nombre} (zona: ${espacio.nombreZona})`,
    );

    // 4. Validar que no tenga tickets activos
    await this.validarTicketActivo(createTicketDto.placa);

    // 5. Crear ticket
    const ticket = this.ticketRepository.create({
      placa: createTicketDto.placa,
      dni: createTicketDto.dni,
      idEspacio: createTicketDto.idEspacio,
      idZona: espacio.idZona,
      nombreZona: espacio.nombreZona,
      fechaHoraIngreso: new Date(),
      activo: true,
      valorRecaudado: 0,
    });

    const ticketGuardado = await this.ticketRepository.save(ticket);
    this.logger.log(
      `✅ Ticket creado con ID: ${ticketGuardado.id} para placa ${createTicketDto.placa}`,
    );

    // 6. Actualizar estado del espacio a OCUPADO (asíncrono)
    this.actualizarEstadoEspacio(createTicketDto.idEspacio, 'OCUPADO').catch(
      (err) => {
        const errorMsg =
          err instanceof Error ? err.message : 'Error desconocido';
        this.logger.error(
          `❌ Error al actualizar espacio a OCUPADO: ${errorMsg}`,
        );
      },
    );

    return ticketGuardado;
  }

  /**
   * Obtener todos los tickets
   */
  async findAll(): Promise<Ticket[]> {
    this.logger.log('📋 Obteniendo todos los tickets');
    const tickets = await this.ticketRepository.find({
      order: { fechaHoraIngreso: 'DESC' },
    });
    this.logger.debug(`✅ Encontrados ${tickets.length} tickets`);
    return tickets;
  }

  /**
   * Obtener un ticket por ID
   */
  async findOne(id: string): Promise<Ticket> {
    this.logger.log(`🔍 Buscando ticket con ID ${id}`);
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) {
      this.logger.warn(`❌ Ticket con ID ${id} no encontrado`);
      throw new NotFoundException(`Ticket con ID ${id} no encontrado`);
    }
    this.logger.debug(
      `✅ Ticket encontrado: ${ticket.id} - placa ${ticket.placa}`,
    );
    return ticket;
  }

  /**
   * Obtener todos los tickets activos
   */
  async findActivos(): Promise<Ticket[]> {
    this.logger.log('📋 Obteniendo tickets activos');
    const tickets = await this.ticketRepository.find({
      where: { activo: true },
      order: { fechaHoraIngreso: 'DESC' },
    });
    this.logger.debug(`✅ Encontrados ${tickets.length} tickets activos`);
    return tickets;
  }

  /**
   * Cerrar un ticket (finalizar estacionamiento)
   */
  async cerrarTicket(
    id: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<Ticket> {
    this.logger.log(`🔒 Cerrando ticket ID ${id}`);
    const ticket = await this.findOne(id);
    if (!ticket.activo) {
      this.logger.warn(`❌ Ticket ${id} ya está cerrado`);
      throw new BadRequestException(`El ticket ya está cerrado`);
    }

    const fechaSalida = new Date();
    const horas = this.calcularHoras(ticket.fechaHoraIngreso, fechaSalida);
    const costo = Math.round((horas * this.tarifaPorHora) * 100) / 100;

    ticket.activo = false;
    ticket.fechaHoraSalida = fechaSalida;
    ticket.valorRecaudado = updateTicketDto.valorRecaudado || costo;

    const closedTicket = await this.ticketRepository.save(ticket);
    this.logger.log(
      `✅ Ticket ${id} cerrado. Horas: ${horas}, Costo: ${costo}`,
    );

    // Actualizar estado del espacio a DISPONIBLE
    this.actualizarEstadoEspacio(ticket.idEspacio, 'DISPONIBLE').catch(
      (err) => {
        const errorMsg =
          err instanceof Error ? err.message : 'Error desconocido';
        this.logger.error(
          `❌ Error al actualizar espacio a DISPONIBLE: ${errorMsg}`,
        );
      },
    );

    return closedTicket;
  }

  /**
   * Eliminar un ticket (físicamente)
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`🗑️ Eliminando ticket ID ${id}`);
    const ticket = await this.findOne(id);
    await this.ticketRepository.delete(id);
    this.logger.log(`✅ Ticket ${id} eliminado`);
  }

  // ---------- Métodos privados ----------

  /**
   * Validar persona por DNI
   */
  private async validarPersona(dni: string): Promise<Persona | null> {
    try {
      const url = `${this.personaUrl}/dni/${dni}`;
      this.logger.debug(`🌐 Consultando persona en ${url}`);
      const userResponse = await this.httpClient.get<UserResponse>(url);
      return {
        dni: userResponse.person.dni,
        nombre: userResponse.person.firstName,
        apellido: userResponse.person.lastName,
        email: userResponse.person.email,
        telefono: userResponse.person.phone,
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`❌ Error al validar persona DNI ${dni}: ${errorMsg}`);
      return null;
    }
  }

  /**
   * Validar vehículo por placa
   */
  private async validarPlaca(placa: string): Promise<Vehiculo | null> {
    try {
      const url = `${this.vehiculoUrl}/placa/${placa}`;
      this.logger.debug(`🌐 Consultando vehículo en ${url}`);
      return await this.httpClient.get<Vehiculo>(url);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`❌ Error al validar placa ${placa}: ${errorMsg}`);
      return null;
    }
  }

  /**
   * Obtener un espacio por ID
   */
  private async obtenerEspacio(idEspacio: string): Promise<Espacio | null> {
    try {
      const url = `${this.espacioUrl}/espacios/${idEspacio}`;
      this.logger.debug(`🌐 Consultando espacio en ${url}`);
      return await this.httpClient.get<Espacio>(url);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `❌ Error al obtener espacio ${idEspacio}: ${errorMsg}`,
      );
      return null;
    }
  }

  /**
   * Validar que no exista un ticket activo para la placa
   */
  private async validarTicketActivo(placa: string): Promise<void> {
    this.logger.debug(`🔍 Verificando tickets activos para placa ${placa}`);
    const ticketActivo = await this.ticketRepository.findOne({
      where: { placa, activo: true },
    });
    if (ticketActivo) {
      this.logger.warn(`❌ Ya existe un ticket activo para la placa ${placa}`);
      throw new BadRequestException(
        `Ya existe un ticket activo para la placa ${placa}`,
      );
    }
    this.logger.debug(`✅ No hay tickets activos para la placa ${placa}`);
  }

  /**
   * Calcular horas entre dos fechas (redondeo hacia arriba)
   */
  private calcularHoras(ingreso: Date, salida: Date): number {
    const diffMs = salida.getTime() - ingreso.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);
    return Math.ceil(diffHoras);
  }

  /**
   * Actualizar estado de un espacio
   */
  private async actualizarEstadoEspacio(
    idEspacio: string,
    estado: string,
  ): Promise<void> {
    try {
      // ✅ Cambio: estado como query param
      const url = `${this.espacioUrl}/espacios/${idEspacio}/estado?estado=${estado}`;
      this.logger.debug(`🌐 Actualizando espacio en ${url}`);
      // No enviamos body, solo la URL con el query param
      await this.httpClient.patch(url, {});
      this.logger.log(`✅ Espacio ${idEspacio} actualizado a ${estado}`);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `❌ Error al actualizar espacio ${idEspacio}: ${errorMsg}`,
      );
      throw error;
    }
  }
}
