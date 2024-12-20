import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  OneToMany,
} from 'typeorm';
import { Mood } from './mood.entity';

@Entity('travels')
@Index('idx_travels_dates', ['startingDate'])
export class Travel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column('text')
  description: string;

  @Column({ type: 'timestamp' })
  startingDate: Date;

  @Column({ type: 'timestamp' })
  endingDate: Date;

  @Column({ type: 'bigint' })
  price: number;

  @Column({ type: 'smallint', default: 0 })
  availableSeats: number;

  @Column({ type: 'smallint', default: 0 })
  totalNumberOfSeats: number;

  @OneToMany(() => Mood, (mood) => mood.travel, { cascade: true })
  moods: Mood[];
}
