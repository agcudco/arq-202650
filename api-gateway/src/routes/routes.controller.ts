import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { routePermissions } from '../auth/route-roles.config';

@Controller('routes')
export class RoutesController {
  @Get()
  @Public() // ✅ Este endpoint es público
  getRoutes() {
    // Transformar la configuración a un formato más amigable
    const rutas = routePermissions.map((r) => ({
      path: r.path.source, // La expresión regular como string
      pathExample: r.pathExample,
      methods: r.methods,
      roles: r.roles === 'PUBLIC' ? 'Público' : r.roles,
    }));

    // Separar rutas públicas y protegidas (opcional)
    const publicas = rutas.filter((r) => r.roles === 'Público');
    const protegidas = rutas.filter((r) => r.roles !== 'Público');

    return {
      total: rutas.length,
      publicas,
      protegidas,
      todas: rutas,
    };
  }
}
