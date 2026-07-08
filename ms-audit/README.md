# Creación del Microservicio de Auditoría

Este microservicio se encarga de registrar todos los eventos de los demás microservicios (vehículos, tickets, etc.) en una base de datos PostgreSQL para trazabilidad y auditoría. Utiliza RabbitMQ como bus de mensajes para recibir eventos asíncronamente y expone un endpoint HTTP opcional para pruebas con rate limiting.

## 1. Crear el proyecto
```
nest new parking-audit-ms
cd parking-audit-ms
```

## 2. Instalar dependencias
```
npm install @nestjs/typeorm typeorm pg uuid @nestjs/config @nestjs/microservices amqplib amqp-connection-manager @nestjs/throttler class-validator class-transformer
npm install @types/uuid @types/amqplib --save-dev
```

## 3. Crear archivo `docker-compose.yml` en la raíz

```
version: '3.8'

services:
  rabbitmq:
    image: rabbitmq:3-management
    container_name: rabbitmq-audit
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"      # AMQP
      - "15672:15672"    # Management UI
    networks:
      - audit-net

networks:
  audit-net:
    driver: bridge
```
Levantar los servicios
```
docker-compose up -d
```

## 4. Configurar variables de entorno (.env)
```
PORT=3004
DB_HOST=localhost
DB_PORT=5433
DB_USER=audit_user
DB_PASSWORD=audit_pass
DB_NAME=audit_db

RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
RABBITMQ_QUEUE=audit_queue
RABBITMQ_EXCHANGE=audit_exchange
RABBITMQ_ROUTING_KEY=audit.event

# Rate limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10
```

## 5. Generar el recurso de auditoría
```
nest g resource audit --no-spec
```

Seleccionar REST API y generar CRUD.
## 6. Estructura de directorios final

```
src/
├── audit/
│   ├── dto/
│   │   ├── create-audit-event.dto.ts
│   │   └── update-audit-event.dto.ts (opcional)
│   ├── entities/
│   │   └── evento-auditoria.entity.ts
│   ├── audit.controller.ts
│   ├── audit.service.ts
│   ├── audit.module.ts
│   └── audit.consumer.ts        # Consumidor RabbitMQ
├── common/
│   └── rate-limiter.guard.ts    (opcional, ya que ThrottlerGuard es global)
├── config/
│   └── rabbitmq.config.ts
├── main.ts
└── app.module.ts
```

## 7. Definir la entidad EventoAuditoria

`src/audit/entities/evento-auditoria.entity.ts:`
```
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'evento_auditoria' })
export class EventoAuditoria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  servicio!: string; //ej. "auth", "users", "products", etc.

  @Column({ type: 'varchar', length: 50 })
  accion!: string; //ej. "create", "update", "delete", etc.

  @Column({ type: 'varchar', length: 100 })
  entidad!: string; //ej. "user", "product", etc.

  @Column({ type: 'jsonb', nullable: true })
  datos?: any; //ej. { "id": 1, "name": "John Doe" }

  @Column({ type: 'varchar', length: 100, nullable: true })
  usuario?: string; //ej. "john.doe", "jane.smith", etc.

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip?: string; //ej. 192.168.205.5

  @Column({ type: 'varchar', length: 50, nullable: true })
  mac?: string; //ej. 00:1B:44:11:3A:B7

  @Column({ type: 'timestamp' })
  timestamp!: Date; //ej. 2023-06-01T12:00:00Z
}

```

## 8. DTO de creación con validación

`src/audit/dto/create-audit-event.dto.ts:`

```
import {
  IsIP,
  IsMACAddress,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAuditEventDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  @MaxLength(50)
  @Matches(/^(ms-[a-zA-Z]+)$/, {
    message: 'El servicio debe comenzar con "ms-" seguido de letras.',
  })
  servicio!: string; //ms-users , ms-auth, ms-products, etc.

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(10)
  @Matches(/^(CREATE|UPDATE|DELETE|LOGIN|LOGOUT|SELECT)$/, {
    message:
      'La acción debe ser una de las siguientes: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, SELECT.',
  })
  accion!: string; //CREATE - UPDATE - DELETE - LOGIN - LOGOUT - SELECT

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(15)
  @Matches(/^[A-Z-]+$/, {
    message: 'El campo solo debe contener letras mayúsculas y guiones medios.',
  })
  entidad!: string;

  @IsObject()
  @IsOptional()
  datos?: Record<string, any>;

  @IsString()
  @IsOptional()
  @MinLength(5) //ejemplo: "john.doe"
  @MaxLength(25)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'El nombre de usuario solo puede contener letras, números, puntos, guiones bajos y guiones medios.',
  })
  usuario?: string;

  @IsIP('4', { message: 'La dirección IP debe ser una dirección IPv4 válida.' })
  @IsNotEmpty()
  ip!: string;

  @IsMACAddress({
    message: 'La dirección MAC debe ser una dirección MAC válida.',
  })
  @IsNotEmpty()
  mac!: string;
}

```
## 9. Servicio de auditoría
`src/audit/audit.service.ts:`
```
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAuditEventDto } from './dto/create-audit-event.dto';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { Repository } from 'typeorm';
import { EventoAuditoria } from './entities/evento-auditoria.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(EventoAuditoria)
    private auditRepo: Repository<EventoAuditoria>,
  ) {}

  async create(dto: CreateAuditEventDto): Promise<EventoAuditoria> {
    const mewEvent = this.auditRepo.create({
      ...dto,
      timestamp: new Date(),
    });

    return this.auditRepo.save(mewEvent);
  }

  async findAll(): Promise<EventoAuditoria[]> {
    return this.auditRepo.find({ order: { timestamp: 'DESC' } });
  }

  async findOne(id: string): Promise<EventoAuditoria | null> {
    return this.auditRepo.findOne({ where: { id } });
  }
}

```

## 10. Controlador HTTP (con rate limiting)
`src/audit/audit.controller.ts:`
```
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuditService } from './audit.service';
import { UpdateAuditDto } from './dto/update-audit.dto';
import { CreateAuditEventDto } from './dto/create-audit-event.dto';

@Controller('audit')
@UseGuards(ThrottlerGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  create(@Body() dto: CreateAuditEventDto) {
    return this.auditService.create(dto);
  }

  @Get()
  findAll() {
    return this.auditService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}

```

## 11. Configuración de RabbitMQ
`src/config/rabbitmq.config.ts` (opcional, se puede poner en el módulo):

```
import { ConfigService } from '@nestjs/config';

export const getRabbitMQConfig = (config: ConfigService) => ({
  host: config.get('RABBITMQ_HOST'),
  port: +config.get('RABBITMQ_PORT'),
  username: config.get('RABBITMQ_USER'),
  password: config.get('RABBITMQ_PASSWORD'),
  queue: config.get('RABBITMQ_QUEUE'),
  exchange: config.get('RABBITMQ_EXCHANGE'),
  routingKey: config.get('RABBITMQ_ROUTING_KEY'),
});

```


## 12. Consumidor RabbitMQ
`src/audit/audit.consumer.ts:`
```
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from './audit.service';
import * as amqp from 'amqplib';
import { plainToClass } from 'class-transformer';
import { CreateAuditEventDto } from './dto/create-audit-event.dto';
import validate from 'node_modules/uuid/dist/validate';
import { ValidationError } from 'class-validator';

@Injectable()
export class AuditConsumer implements OnModuleInit {
  private readonly logger = new Logger(AuditConsumer.name);
  private connection: any;
  private channel: any;

  constructor(
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.consume();
  }

  private async connect() {
    const host = this.configService.get('RABBITMQ_HOST');
    const port = this.configService.get('RABBITMQ_PORT');
    const user = this.configService.get('RABBITMQ_USER');
    const pass = this.configService.get('RABBITMQ_PASSWORD');
    const url = `amqp://${user}:${pass}@${host}:${port}`;

    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      this.logger.log(`Connected to RabbitMQ at ${url}`);
    } catch (error) {
      this.logger.error(`Failed to connect to RabbitMQ at ${error}`);
      setTimeout(() => this.connect(), 5000); // Retry after 5 seconds
    }
  }

  private async consume() {
    const queue = this.configService.get('RABBITMQ_QUEUE');
    const exchange = this.configService.get('RABBITMQ_EXCHANGE');
    const routingKey = this.configService.get('RABBITMQ_ROUTING_KEY');

    try {
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, exchange, routingKey);

      this.channel.consume(
        queue,
        async (msg) => {
          if (msg) {
            const content = msg.content.toString();
            this.logger.debug(`Mensaje recibido: ${content}`);
            try {
              const raw = JSON.parse(content);
              const dto = plainToClass(CreateAuditEventDto, raw);
              const errors = await validate(dto);

              // Verificar que errors sea un arreglo y tenga elementos
              if (Array.isArray(errors) && errors.length > 0) {
                const errorMessages = errors.map((e: ValidationError) =>
                  Object.values(e.constraints || {}).join(', '),
                );
                this.logger.warn(`DTO inválido: ${errorMessages.join('; ')}`);
                // Rechazar el mensaje y no reencolar (para evitar bucles)
                this.channel.nack(msg, false, false);
                return;
              }

              // Guardar el evento de auditoría
              await this.auditService.create(dto);
              this.logger.debug('Evento de auditoría guardado exitosamente');
              this.channel.ack(msg);
            } catch (err) {
              const errorMessage =
                err instanceof Error ? err.message : 'Error desconocido';
              this.logger.error(`Error procesando mensaje: ${errorMessage}`);
              // Rechazar el mensaje y no reencolar
              this.channel.nack(msg, false, false);
            }
          }
        },
        { noAck: false },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error configurando consumidor: ${errorMessage}`);
    }
  }
}

```

## 13. Módulo de auditoría
`src/audit/audit.module.ts:`
```
import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { EventoAuditoria } from './entities/evento-auditoria.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditConsumer } from './audit.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([EventoAuditoria])],
  controllers: [AuditController],
  providers: [AuditService, AuditConsumer],
})
export class AuditModule {}

```

## 14. Configurar `main.ts con` validación global
`src/main.ts:`
```
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3004);
  console.log(`Audit MS corriendo en puerto ${process.env.PORT || 3004}`);
}
bootstrap();

```


## 15. Configurar módulo principal (app.module.ts) - ultimo paso
```
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './audit/audit.module';
import { EventoAuditoria } from './audit/entities/evento-auditoria.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: +config.get('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [EventoAuditoria],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: +config.get('THROTTLE_TTL'),
            limit: +config.get('THROTTLE_LIMIT'),
          },
        ],
      }),
      inject: [ConfigService],
    }),
    AuditModule,
  ],
})
export class AppModule {}
```

# Comunicación desde otros microservicios
Los otros microservicios (vehículos, tickets, personas) deben publicar eventos en RabbitMQ usando el mismo exchange y routing key. Pueden usar el cliente amqplib o el ClientProxy de NestJS con el transportador RabbitMQ.

## Modificación del microservicio de vehículos para emitir eventos a RabbitMQ

### 1. Instalar dependencias en el microservicio de vehículos

```
cd ../vehiculos
npm install amqplib @types/amqplib --save
```

### 2. Variables de entorno (.env) en vehículos
Añade las siguientes líneas al archivo .env del microservicio de vehículos:

```
# ... configuraciones existentes ...
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
RABBITMQ_EXCHANGE=audit_exchange
RABBITMQ_ROUTING_KEY=audit.event
```

### 3. Crear un servicio de publicación de eventos
Crea un nuevo archivo: `src/common/event-publisher.service.ts`

```
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

export interface AuditEvent {
  servicio: string;
  accion: string;
  entidad: string;
  entidadId?: string;
  datos?: any;
  usuario?: string;
  ip?: string;
}

@Injectable()
export class EventPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisher.name);
  private connection: any = null; // any para evitar conflictos de tipos
  private channel: any = null;
  private exchange: string;
  private routingKey: string;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(private configService: ConfigService) {
    this.exchange =
      this.configService.get('RABBITMQ_EXCHANGE') ?? 'audit_exchange';
    this.routingKey =
      this.configService.get('RABBITMQ_ROUTING_KEY') ?? 'audit.event';
  }

  async onModuleInit() {
    await this.connect();
  }

  private async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.doConnect();
    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async doConnect(): Promise<void> {
    const host = this.configService.get('RABBITMQ_HOST');
    const port = this.configService.get('RABBITMQ_PORT');
    const user = this.configService.get('RABBITMQ_USER');
    const pass = this.configService.get('RABBITMQ_PASSWORD');
    const url = `amqp://${user}:${pass}@${host}:${port}`;

    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, 'topic', {
        durable: true,
      });
      this.isConnected = true;
      this.logger.log('✅ Conectado a RabbitMQ para publicación de eventos');

      // Manejar cierre inesperado
      this.connection.on('close', () => {
        this.logger.warn(
          '⚠️ Conexión a RabbitMQ cerrada, intentando reconectar...',
        );
        this.isConnected = false;
        this.channel = null;
        this.connection = null;
        this.scheduleReconnect();
      });

      this.connection.on('error', (err: any) => {
        this.logger.error(`❌ Error en conexión RabbitMQ: ${err.message}`);
        this.isConnected = false;
        this.channel = null;
        this.connection = null;
        this.scheduleReconnect();
      });
    } catch (error) {
      this.isConnected = false;
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`❌ Error conectando a RabbitMQ: ${errorMessage}`);
      this.scheduleReconnect();
      throw error;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.logger.log('Intentando reconectar a RabbitMQ...');
      this.connect();
    }, 5000);
  }

  async publish(event: AuditEvent): Promise<void> {
    // Si no está conectado, intenta conectar (espera hasta 5s)
    if (!this.isConnected || !this.channel) {
      this.logger.warn('⏳ Canal no establecido, intentando conectar...');
      await this.connect();

      if (!this.isConnected || !this.channel) {
        this.logger.error(
          '❌ No se pudo establecer conexión con RabbitMQ, evento no publicado',
        );
        return;
      }
    }

    try {
      const message = Buffer.from(JSON.stringify(event));
      this.channel.publish(this.exchange, this.routingKey, message, {
        persistent: true,
      });
      this.logger.debug(
        `📤 Evento publicado: ${event.accion} en ${event.servicio}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`❌ Error publicando evento: ${errorMessage}`);
      this.isConnected = false;
      this.channel = null;
    }
  }

  async onModuleDestroy() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
    } catch (error) {
      // Ignoramos errores al cerrar
    }
    this.logger.log('Conexión a RabbitMQ cerrada');
  }
}

```

### 4. Modificar el módulo de vehículos para incluir el EventPublisher
`src/vehiculos/vehiculos.module.ts:`

```
import { Module } from '@nestjs/common';
import { VehiculosService } from './vehiculos.service';
import { VehiculosController } from './vehiculos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehiculo } from './entities/vehiculo.entity';
import { Auto } from './entities/auto.entity';
import { Motocicleta } from './entities/motocicleta.entity';
import { Camioneta } from './entities/camioneta.entity';
import { EventPublisher } from '../common/event-publisher.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vehiculo, Auto, Motocicleta, Camioneta])],
  controllers: [VehiculosController],
  providers: [VehiculosService, EventPublisher],
  exports: [VehiculosService],
})
export class VehiculosModule {}

```

### 5. Modificar el servicio de vehículos para emitir eventos
`src/vehiculos/vehiculos.service.ts` (versión con eventos):
```
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateVehiculoDto } from './dto/create-vehiculo.dto';
import { UpdateVehiculoDto } from './dto/update-vehiculo.dto';
import { Vehiculo } from './entities/vehiculo.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FactoryVehiculos } from './factory/factory-vehiculo';
import { AuditEvent, EventPublisher } from '../common/event-publisher.service';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectRepository(Vehiculo)
    private repositoryVehiculo: Repository<Vehiculo>,
    private eventPublisher: EventPublisher,
  ) {}

  // Método auxiliar para publicar eventos
  private async emitEvent(
    accion: string,
    vehiculo: Vehiculo,
    datosExtra?: any,
  ) {
    const event: AuditEvent = {
      servicio: 'vehiculos',
      accion,
      entidad: 'Vehiculo',
      datos: { ...vehiculo, ...datosExtra },
      // usuario e ip se podrían obtener del contexto (request) si se inyecta
    };
    await this.eventPublisher.publish(event);
  }

  async create(createVehiculoDto: CreateVehiculoDto): Promise<Vehiculo> {
    const existe = await this.repositoryVehiculo.findOne({
      where: { placa: createVehiculoDto.datos.placa },
    });

    if (existe) {
      throw new Error('Ya existe un vehículo con esa placa');
    }

    const vehiculo = FactoryVehiculos.crear(createVehiculoDto);
    const saved = await this.repositoryVehiculo.save(vehiculo);
    await this.emitEvent('CREATE', saved);
    return saved;

  }

  async findAll(): Promise<Vehiculo[]> {
    return this.repositoryVehiculo.find();
  }

  async findOne(id: string): Promise<Vehiculo> {
    const vehiculo = await this.repositoryVehiculo.findOne({ where: { id } });
    if (!vehiculo) {
      throw new Error('Vehículo no encontrado');
    }
    return vehiculo;
  }

  async update(id: string, actualizarDto: UpdateVehiculoDto): Promise<Vehiculo> {
    const vehiculo = await this.findOne(id);
    if (actualizarDto.tipo && actualizarDto.tipo !== vehiculo.obtenerTipo()) {
      throw new BadRequestException('No se puede cambiar el tipo de vehículo');
    }
    // Guardar estado anterior para el evento (opcional)
    const estadoAnterior = { ...vehiculo };
    Object.assign(vehiculo, actualizarDto.datos);
    const updated = await this.repositoryVehiculo.save(vehiculo);
    // Publicar evento con estado anterior y nuevo
    await this.emitEvent('UPDATE', updated, { estadoAnterior });
    return updated;
  }

  remove(id: number) {
    return `This action removes a #${id} vehiculo`;
  }
}

```

### 6. Probar la integración
* Verificar de que RabbitMQ esté corriendo (con `docker-compose` del microservicio de auditoría).

* Levantar el microservicio de vehículos: `npm run start:dev`.

* Realizar una operación (por ejemplo, crear un vehículo) y verificar que el evento se publique correctamente.

* En el microservicio de auditoría, revisar los logs del consumidor para ver que recibe y guarda el evento.

### 7. Consideraciones adicionales
- **Resiliencia:** El EventPublisher reintenta la conexión si falla. Además, si la publicación falla, solo se loguea el error y la operación principal continúa.

- **Manejo de errores:** En el servicio, si la publicación falla, no se lanza excepción para no interrumpir el flujo principal.

- **Eventos:** Se envían eventos para CREAR, ACTUALIZAR, ELIMINAR y DESACTIVAR. Puedes agregar más acciones según necesidades.

- **Datos del evento:** Se envía el objeto completo del vehículo, incluyendo las propiedades específicas de cada subclase (puertas, capacidad, etc.). En el caso de actualización, se incluye estadoAnterior.