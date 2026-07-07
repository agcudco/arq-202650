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
