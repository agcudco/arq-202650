import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { routePermissions } from '../../auth/route-roles.config';

@Injectable()
export class RoutesLoggerService implements OnModuleInit {
  private readonly logger = new Logger('RoutesLogger');

  onModuleInit() {
    this.logRoutes();
  }

  private logRoutes() {
    this.logger.log('📋 ===== RUTAS REGISTRADAS =====');

    // ========== 1. Rutas propias del Gateway ==========
    const gatewayRoutes = [
      { path: '/auth/login', methods: ['POST'], roles: 'Público', desc: 'Iniciar sesión' },
      { path: '/auth/refresh', methods: ['POST'], roles: 'Público', desc: 'Renovar token' },
      { path: '/routes', methods: ['GET'], roles: 'Público', desc: 'Listar todas las rutas' },
    ];

    this.logger.log('🔓 GATEWAY (Públicas):');
    gatewayRoutes.forEach(r => {
      this.logger.log(`   ${r.methods.join(', ').padEnd(6)} ${r.path.padEnd(30)} → ${r.roles} (${r.desc})`);
    });

    // ========== 2. Rutas de microservicios ==========
    const publicas = routePermissions.filter(r => r.roles === 'PUBLIC');
    const protegidas = routePermissions.filter(r => r.roles !== 'PUBLIC');

    if (publicas.length > 0) {
      this.logger.log('🔓 MICROSERVICIOS (Públicas):');
      publicas.forEach(r => {
        this.logger.log(`   ${r.methods.join(', ').padEnd(6)} ${r.pathExample.padEnd(30)} → Público (${r.description || ''})`);
      });
    }

    if (protegidas.length > 0) {
      this.logger.log('🔒 MICROSERVICIOS (Protegidas):');
      protegidas.forEach(r => {
        const rolesStr = Array.isArray(r.roles) ? r.roles.join(', ') : r.roles;
        this.logger.log(`   ${r.methods.join(', ').padEnd(6)} ${r.pathExample.padEnd(30)} → Requiere: ${rolesStr.padEnd(20)} (${r.description || ''})`);
      });
    }

    const total = gatewayRoutes.length + publicas.length + protegidas.length;
    this.logger.log(`📊 Total: ${total} rutas`);
    this.logger.log('=========================================');
  }
}