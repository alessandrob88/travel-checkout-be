import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { Travel } from '../travel/entities/travel.entity';
import { BaseEntity } from '../../shared/base/base.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  //this is to differentiate a booking from cancelled status in case a user is deactived somehow (not part of current implementation)
  USER_SOFT_DELETED = 'user_soft_deleted',
}

@Entity('bookings')
export class Booking extends BaseEntity {
  @Column({ type: 'int' })
  @Index()
  selectedSeats: number;

  @Column({ type: 'int' })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ type: 'timestamp', nullable: true })
  expirationTime: Date | null;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Travel, (travel) => travel.id, { nullable: false })
  travel: Travel;
}
