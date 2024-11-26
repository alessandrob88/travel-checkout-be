import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../shared/base/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true, type: 'varchar' })
  email: string;
}
