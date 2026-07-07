import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HttpClientService } from './common/httpl-client.service';
import { ConfigService } from '@nestjs/config';
import { Persona } from './interfaces/persona.interface';
import { Vehiculo } from './interfaces/vehiculo.interface';
import { Espacio } from './interfaces/espacio.interface';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);
  private readonly personaUrl: string;
  private readonly espacioUrl: string;
  private readonly tarifaPorHora: number;
  private readonly vehiculoUrl: string;

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
  }

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    //1 validar persona

    const persona = await this.validarPersona(createTicketDto.dni);
    if (!persona)
      throw new BadRequestException(
        `Persona con DNI ${createTicketDto.dni} no encontrada`,
      );

    //2 validar placa

    const vehiculo = await this.validarPlaca(createTicketDto.placa);
    if (!vehiculo)
      throw new BadRequestException(
        `Vehiculo con placa ${createTicketDto.placa} no encontrado`,
      );

    //3 buscar espacio disponible
    const espacioDisponible = await this.validarEspacioDisponible(
      createTicketDto.idEspacio,
      createTicketDto.zona,
    );

    if (!espacioDisponible)
      throw new BadRequestException(
        `Espacio con id ${createTicketDto.idEspacio} no está disponible o no existe`,
      );

    //4 validar que no tenga tickets activos
    await this.validarTicketActivo(createTicketDto.placa);

    //5 crear ticket
    const ticket = this.ticketRepository.create({
      ...createTicketDto,
      fechaHoraIngreso: new Date(),
      activo: true,
      valorRecaudado: 0,
    });

    const ticketGuardado = await this.ticketRepository.save(ticket);
    //cambiar de estado al espacio
    this.logger.log(
      `Ticket creado con id: ${ticketGuardado.id} para la placa ${createTicketDto.placa}`,
    );
    return ticketGuardado;
  }

  async findAll(): Promise<Ticket[]> {
    return this.ticketRepository.find({ order: { fechaHoraIngreso: 'DESC' } });
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });

    if (!ticket)
      throw new BadRequestException(`Ticket con id ${id} no encontrado`);

    return ticket;
  }

  async findActivos(): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { activo: true },
      order: { fechaHoraIngreso: 'DESC' },
    });
  }

  async cerrarTicket(
    id: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);
    if (!ticket)
      throw new BadRequestException(`Ticket con id ${id} no encontrado`);

    const fechaSalida = new Date();

    const horas = this.calcularHoras(ticket.fechaHoraIngreso, fechaSalida);
    const costo = horas * this.tarifaPorHora;

    ticket.activo = false;
    ticket.fechaHoraSalida = fechaSalida;
    ticket.valorRecaudado = updateTicketDto.valorRecaudado || costo;

    //actualizar estado del espacio - tarea viernes 12/06/2026 - revisar lunes 15/06/2026
    const closedTicket = await this.ticketRepository.save(ticket);
    this.logger.log(`Ticket con id ${id} cerrado`);
    return closedTicket;
  }

  remove(id: number) {
    return `This action removes a #${id} ticket`;
  }

  ///metodos privados
  private async validarPersona(dni: string): Promise<Persona | null> {
    try {
      const url = `${this.personaUrl}/${dni}`; //localhost:8080/api/personas/0503495350
      const persona = await this.httpClient.get<Persona>(url);
      return persona;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  private async validarPlaca(placa: string): Promise<Vehiculo | null> {
    try {
      const url = `${this.vehiculoUrl}/${placa}`; ///localhost:3000/vehiculo/ABC-1234
      const vehiculo = await this.httpClient.get<Vehiculo>(url);
      return vehiculo;
    } catch (error) {
      this.logger.error(`Error al validar la placa (${placa}):${error}`);
      return null;
    }
  }

  private async validarEspacioDisponible(
    idEspacio: string,
    zona: string,
  ): Promise<Espacio | null> {
    try {
      //devolver espacios dado zona
      //mejorar esta función el viernes
      const url = `${this.espacioUrl}/disponibles?zona=${zona}`;
      const espacios = await this.httpClient.get<Espacio[]>(url);

      return (
        espacios.find(
          (espacio) =>
            espacio.id === idEspacio && espacio.estado === 'DISPONIBLE',
        ) || null
      );
    } catch (error) {
      this.logger.error(`Error al validar el espacio: ${error}`);
      return null;
    }
  }

  private async validarTicketActivo(placa: string): Promise<void> {
    const ticketActivo = await this.ticketRepository.findOne({
      where: { placa, activo: true },
    });
    if (ticketActivo)
      throw new BadRequestException(
        'Ya existe un ticket activo con esta placa',
      );
  }

  private calcularHoras(ingreso: Date, salida: Date): number {
    const diffMs = salida.getTime() - ingreso.getTime();
    const difHoras = diffMs / (1000 * 60 * 60);
    return Math.ceil(difHoras);
  }
}
