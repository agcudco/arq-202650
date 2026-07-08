export interface Espacio {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  activo: boolean;
  nombreZona: string;
  idZona: string;
  estado: string; // DISPONIBLE, OCUPADO, RESERVADO
  fechaCreacion: string;
  fechaActualizacion: string;
}