# Implementación de Server-Sent Events (SSE)

## Resumen del flujo
- Creación de ticket → espacio cambia a OCUPADO → TicketsService emite evento SSE espacio-actualizado.

- Cierre de ticket → espacio cambia a DISPONIBLE → emite evento SSE.

- Dashboard está suscrito al endpoint /sse/espacios y al recibir un evento, recarga la lista completa de espacios desde el microservicio de espacios.

- Actualización visual: los espacios se pintan con colores según su estado (verde = DISPONIBLE, rojo = OCUPADO, amarillo = RESERVADO).

## Estructura de directorios

```
backend/tickets/                       # Microservicio de tickets (NestJS)
├── src/
│   ├── sse/
│   │   ├── sse.module.ts
│   │   ├── sse.service.ts
│   │   └── sse.controller.ts
│   ├── tickets/
│   │   └── tickets.service.ts         # Modificado para emitir eventos
│   └── ...
├── .env
└── ...

dashboard/                             # Dashboard
├── index.html
├── app.js
├── styles.css
```

## 1. Nuevo módulo SSE en el microservicio de tickets

`src/sse/sse.module.ts`

```
import { Module } from '@nestjs/common';
import { SseService } from './sse.service';
import { SseController } from './sse.controller';

@Module({
  providers: [SseService],
  controllers: [SseController],
  exports: [SseService],
})
export class SseModule {}
```

`src/sse/sse.service.ts`

```
import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface SseEvent {
  type: string;
  data: any;
}

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);
  private eventSubject = new Subject<SseEvent>();

  /**
   * Observable para que los controladores lo suscriban
   */
  getEventStream() {
    return this.eventSubject.asObservable();
  }

  /**
   * Emitir un evento a todos los clientes conectados
   */
  emitEvent(type: string, data: any) {
    this.logger.log(`📡 Emitiendo evento SSE: ${type}`);
    this.eventSubject.next({ type, data });
  }
}
```

`src/sse/sse.controller.ts`

```
import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { SseService } from './sse.service';
import { Observable, map } from 'rxjs';

@Controller('sse')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Sse('espacios')
  streamEspacios(): Observable<MessageEvent> {
    return this.sseService.getEventStream().pipe(
      map((event) => ({
        data: JSON.stringify(event),
        type: event.type,
      })),
    );
  }
}
```
## 2. Modificar TicketsService para emitir eventos

Inyectar `SseService` y llamar a `emitEvent` cuando se crea o cierra un ticket.
```
// src/tickets/tickets.service.ts (fragmentos modificados)

import { SseService } from '../sse/sse.service';

@Injectable()
export class TicketsService {
  // ...
  constructor(
    // ... otros
    private readonly sseService: SseService,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    // ... validaciones y creación

    // Después de guardar ticket, emitir evento (asíncrono)
    this.actualizarEstadoEspacio(createTicketDto.idEspacio, 'OCUPADO')
      .then(() => {
        // Emitir evento con el espacio actualizado
        this.sseService.emitEvent('espacio-actualizado', {
          id: createTicketDto.idEspacio,
          estado: 'OCUPADO',
        });
      })
      .catch(err => {
        this.logger.error('Error al emitir evento SSE', err);
      });

    return ticketGuardado;
  }

  async cerrarTicket(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    // ... cerrar ticket

    // Después de guardar, emitir evento
    this.actualizarEstadoEspacio(ticket.idEspacio, 'DISPONIBLE')
      .then(() => {
        this.sseService.emitEvent('espacio-actualizado', {
          id: ticket.idEspacio,
          estado: 'DISPONIBLE',
        });
      })
      .catch(err => {
        this.logger.error('Error al emitir evento SSE', err);
      });

    return closedTicket;
  }
}
```

Nota: Asegúrate de importar SseModule en TicketsModule y agregar SseService a los providers.

`tickets.module.ts`

```
import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { HttpClientService } from './common/httpl-client.service';
import { SseModule } from 'src/sse/sse.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket]),SseModule],
  controllers: [TicketsController],
  providers: [TicketsService, HttpClientService],
})
export class TicketsModule {}

```

`app.module.ts`
```
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsModule } from './tickets/tickets.module';
import { Ticket } from './tickets/entities/ticket.entity';
import { ThrottlerModule } from '@nestjs/throttler';
import { SseModule } from './sse/sse.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 10,
    }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USUARIO'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NOMBRE'),
        entities: [Ticket],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    TicketsModule,
    SseModule
  ],
})
export class AppModule {}
```

## Dashboard de monitoreo
### `index.html`
```
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dashboard - Espacios de Estacionamiento</title>
    <!-- Tailwind CSS vía CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Estilos adicionales -->
    <link rel="stylesheet" href="styles.css" />
</head>
<body class="bg-gray-100 p-6 font-sans antialiased">

    <div class="max-w-7xl mx-auto">
        <!-- Encabezado -->
        <header class="flex items-center justify-between mb-8">
            <h1 class="text-3xl font-bold text-gray-800">🅿️ Dashboard de Espacios</h1>
            <div class="flex items-center gap-4">
                <span id="totalEspacios" class="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">Cargando...</span>
                <span id="statusConexion" class="flex items-center gap-2 text-sm">
                    <span class="w-3 h-3 bg-green-500 rounded-full inline-block" id="indicator"></span>
                    <span id="statusText">Conectado</span>
                </span>
            </div>
        </header>

        <!-- Contenedor de tarjetas (grid) -->
        <div id="espaciosContainer" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <!-- Las tarjetas se inyectan dinámicamente desde app.js -->
        </div>

        <!-- Pie de página con timestamp de última actualización -->
        <footer class="mt-8 text-sm text-gray-500 text-center border-t pt-4">
            Última actualización: <span id="lastUpdate">--</span>
        </footer>
    </div>

    <!-- Nuestro JavaScript -->
    <script src="app.js"></script>
</body>
</html>
```

### styles.css
```
/* Colores según estado */
.bg-disponible {
    background-color: #d1fae5; /* verde claro */
    border-left: 6px solid #10b981;
}
.bg-ocupado {
    background-color: #fee2e2; /* rojo claro */
    border-left: 6px solid #ef4444;
}
.bg-reservado {
    background-color: #fef3c7; /* amarillo claro */
    border-left: 6px solid #f59e0b;
}

/* Transición suave al cambiar estado */
.espacio-card {
    transition: all 0.3s ease;
}
.espacio-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```
### `app.js`
```
// ============================================================
// 1. Configuración de URLs
// ============================================================
const API_ESPACIOS = 'http://localhost:8081/api/espacios';
const SSE_URL = 'http://localhost:3001/sse/espacios';

// ============================================================
// 2. Elementos del DOM
// ============================================================
const container = document.getElementById('espaciosContainer');
const totalSpan = document.getElementById('totalEspacios');
const lastUpdateSpan = document.getElementById('lastUpdate');
const indicator = document.getElementById('indicator');
const statusText = document.getElementById('statusText');

// ============================================================
// 3. Funciones auxiliares
// ============================================================
const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleString('es-ES', { hour12: false });
};

const setConnectionStatus = (connected) => {
    if (connected) {
        indicator.className = 'w-3 h-3 bg-green-500 rounded-full inline-block';
        statusText.textContent = 'Conectado';
    } else {
        indicator.className = 'w-3 h-3 bg-red-500 rounded-full inline-block';
        statusText.textContent = 'Desconectado';
    }
};

// ============================================================
// 4. Obtener espacios desde el microservicio
// ============================================================
const fetchEspacios = async () => {
    try {
        const response = await fetch(API_ESPACIOS);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener espacios:', error);
        return null;
    }
};

// ============================================================
// 5. Renderizar tarjetas en el grid
// ============================================================
const renderizarEspacios = (espacios) => {
    if (!espacios || espacios.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <p class="text-xl">No hay espacios disponibles</p>
            </div>
        `;
        totalSpan.textContent = '0 espacios';
        return;
    }

    // Construir HTML de las tarjetas
    const html = espacios.map((esp) => {
        const estadoClass = `bg-${esp.estado.toLowerCase()}`;
        return `
            <div class="espacio-card ${estadoClass} rounded-lg shadow p-4 flex flex-col">
                <div class="font-bold text-lg text-gray-800">${esp.nombre || 'Sin nombre'}</div>
                <div class="text-sm text-gray-600">Zona: ${esp.nombreZona || 'N/A'}</div>
                <div class="text-sm text-gray-600">Tipo: ${esp.tipo || 'N/A'}</div>
                <div class="mt-2 flex items-center justify-between">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full 
                        ${esp.estado === 'DISPONIBLE' ? 'bg-green-200 text-green-800' :
                          esp.estado === 'OCUPADO' ? 'bg-red-200 text-red-800' :
                          'bg-yellow-200 text-yellow-800'}">
                        ${esp.estado}
                    </span>
                    <span class="text-xs text-gray-400">ID: ${esp.id.slice(0,8)}</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
    totalSpan.textContent = `${espacios.length} espacios`;
    lastUpdateSpan.textContent = formatDate(new Date());
};

// ============================================================
// 6. Carga inicial y actualización completa
// ============================================================
const cargarEspacios = async () => {
    const data = await fetchEspacios();
    if (data) {
        renderizarEspacios(data);
        setConnectionStatus(true);
    } else {
        setConnectionStatus(false);
    }
};

// ============================================================
// 7. EventSource (SSE) para actualizaciones en tiempo real
// ============================================================
const conectarSSE = () => {
    const eventSource = new EventSource(SSE_URL);

    eventSource.onopen = () => {
        console.log('SSE: conexión establecida');
        setConnectionStatus(true);
    };

    eventSource.onmessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            console.log('SSE recibido:', payload);
            // Cada vez que recibimos un evento, recargamos todos los espacios
            // (también sirve para reflejar nuevos espacios insertados)
            cargarEspacios();
        } catch (e) {
            console.error('Error al parsear evento SSE:', e);
        }
    };

    eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setConnectionStatus(false);
        eventSource.close();
        // Reintentar después de 5 segundos
        setTimeout(conectarSSE, 5000);
    };

    return eventSource;
};

// ============================================================
// 8. Inicializar
// ============================================================
(async () => {
    // Cargar espacios al inicio
    await cargarEspacios();

    // Conectar SSE
    conectarSSE();

    // Actualización periódica cada 30 segundos por si el SSE falla
    setInterval(cargarEspacios, 30000);
})();
```
