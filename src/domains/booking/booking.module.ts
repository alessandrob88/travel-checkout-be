import { Module } from '@nestjs/common';
import { BookingResolver } from './booking.resolver';
import { BookingService } from './booking.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { BookingValidator } from './booking.validator';
import { UserModule } from '../user/user.module';
import { TravelModule } from '../travel/travel.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    UserModule,
    TravelModule,
    PaymentModule,
  ],
  providers: [BookingResolver, BookingService, BookingValidator],
  exports: [BookingService],
})
export class BookingModule {}
