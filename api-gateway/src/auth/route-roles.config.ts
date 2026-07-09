export interface RoutePermission {
  path: RegExp;
  pathExample: string;
  methods: string[];
  roles: string[] | 'PUBLIC';
  description?: string;
}

export const routePermissions: RoutePermission[] = [
  // ===== USUARIOS =====
  {
    path: /^\/api\/users$/,
    pathExample: '/api/users',
    methods: ['GET', 'POST'],
    roles: ['ADMIN'],
    description: 'Listar y crear usuarios',
  },
  {
    path: /^\/api\/users\/[0-9a-fA-F-]+$/,
    pathExample: '/api/users/{id}',
    methods: ['GET', 'PUT', 'DELETE'],
    roles: ['ADMIN'],
    description: 'Obtener, actualizar o eliminar usuario por ID',
  },
  {
    path: /^\/api\/users\/dni\/\w+$/,
    pathExample: '/api/users/dni/{dni}',
    methods: ['GET'],
    roles: ['ADMIN'],
    description: 'Buscar usuario por DNI',
  },
  {
    path: /^\/api\/users\/[0-9a-fA-F-]+\/roles\/[0-9a-fA-F-]+$/,
    pathExample: '/api/users/{userId}/roles/{roleId}',
    methods: ['POST', 'DELETE'],
    roles: ['ADMIN'],
    description: 'Asignar o desasignar rol a usuario',
  },

  // ===== ESPACIOS =====
  {
    path: /^\/api\/espacios$/,
    pathExample: '/api/espacios',
    methods: ['GET'],
    roles: 'PUBLIC',
    description: 'Listar todos los espacios',
  },
  {
    path: /^\/api\/espacios$/,
    pathExample: '/api/espacios',
    methods: ['POST'],
    roles: ['ADMIN'],
    description: 'Crear un nuevo espacio',
  },
  {
    path: /^\/api\/espacios\/[0-9a-fA-F-]+$/,
    pathExample: '/api/espacios/{id}',
    methods: ['GET'],
    roles: 'PUBLIC',
    description: 'Obtener espacio por ID',
  },
  {
    path: /^\/api\/espacios\/[0-9a-fA-F-]+$/,
    pathExample: '/api/espacios/{id}',
    methods: ['PUT', 'DELETE'],
    roles: ['ADMIN'],
    description: 'Actualizar o eliminar espacio',
  },
  {
    path: /^\/api\/espacios\/[0-9a-fA-F-]+\/estado$/,
    pathExample: '/api/espacios/{id}/estado?estado=...',
    methods: ['PATCH'],
    roles: ['ADMIN'],
    description: 'Cambiar estado de un espacio',
  },
  {
    path: /^\/api\/espacios\/estado\/\w+$/,
    pathExample: '/api/espacios/estado/{estado}',
    methods: ['GET'],
    roles: 'PUBLIC',
    description: 'Listar espacios por estado',
  },
  {
    path: /^\/api\/espacios\/zona\/[0-9a-fA-F-]+$/,
    pathExample: '/api/espacios/zona/{idZona}',
    methods: ['GET'],
    roles: 'PUBLIC',
    description: 'Listar espacios por zona',
  },
  {
    path: /^\/api\/espacios\/zona\/[0-9a-fA-F-]+\/estado\/\w+$/,
    pathExample: '/api/espacios/zona/{idZona}/estado/{estado}',
    methods: ['GET'],
    roles: 'PUBLIC',
    description: 'Listar espacios por zona y estado',
  },

  // ===== VEHÍCULOS =====
  {
    path: /^\/api\/vehiculos$/,
    pathExample: '/api/vehiculos',
    methods: ['GET'],
    roles: 'PUBLIC',
    description: 'Listar vehículos',
  },
  {
    path: /^\/api\/vehiculos$/,
    pathExample: '/api/vehiculos',
    methods: ['POST'],
    roles: ['ADMIN'],
    description: 'Crear vehículo',
  },
  {
    path: /^\/api\/vehiculos\/[0-9a-fA-F-]+$/,
    pathExample: '/api/vehiculos/{id}',
    methods: ['GET'],
    roles: 'PUBLIC',
    description: 'Obtener vehículo por ID',
  },
  {
    path: /^\/api\/vehiculos\/[0-9a-fA-F-]+$/,
    pathExample: '/api/vehiculos/{id}',
    methods: ['PATCH', 'DELETE'],
    roles: ['ADMIN'],
    description: 'Actualizar o eliminar vehículo',
  },
  {
    path: /^\/api\/vehiculos\/placa\/\w+$/,
    pathExample: '/api/vehiculos/placa/{placa}',
    methods: ['GET'],
    roles: 'PUBLIC',
    description: 'Buscar vehículo por placa',
  },

  // ===== TICKETS =====
  {
    path: /^\/api\/tickets$/,
    pathExample: '/api/tickets',
    methods: ['GET', 'POST'],
    roles: ['ADMIN', 'RECAUDADOR'],
    description: 'Listar y crear tickets',
  },
  {
    path: /^\/api\/tickets\/activos$/,
    pathExample: '/api/tickets/activos',
    methods: ['GET'],
    roles: ['ADMIN', 'RECAUDADOR'],
    description: 'Listar tickets activos',
  },
  {
    path: /^\/api\/tickets\/[0-9a-fA-F-]+$/,
    pathExample: '/api/tickets/{id}',
    methods: ['GET'],
    roles: ['ADMIN', 'RECAUDADOR'],
    description: 'Obtener ticket por ID',
  },
  {
    path: /^\/api\/tickets\/[0-9a-fA-F-]+$/,
    pathExample: '/api/tickets/{id}',
    methods: ['PATCH'],
    roles: ['ADMIN', 'RECAUDADOR'],
    description: 'Cerrar ticket',
  },
  {
    path: /^\/api\/tickets\/[0-9a-fA-F-]+$/,
    pathExample: '/api/tickets/{id}',
    methods: ['DELETE'],
    roles: ['ADMIN'],
    description: 'Eliminar ticket',
  },

  // ===== SSE =====
  {
    path: /^\/sse\/espacios$/,
    pathExample: '/sse/espacios',
    methods: ['GET'],
    roles: 'PUBLIC',
    description: 'Eventos SSE de espacios',
  },
];
