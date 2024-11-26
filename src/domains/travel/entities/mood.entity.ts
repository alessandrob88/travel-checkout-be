import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Travel } from './travel.entity';

export enum MoodType {
  NATURE = 'nature',
  RELAX = 'relax',
  HISTORY = 'history',
  CULTURE = 'culture',
  PARTY = 'party',
}

@Entity('moods')
export class Mood {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Travel, (travel) => travel.moods, { onDelete: 'CASCADE' })
  travel: Travel;

  @Column({
    type: 'enum',
    enum: MoodType,
  })
  mood: MoodType;

  @Column({ type: 'smallint' })
  score: number;
}
