import { Injectable } from '@nestjs/common';
import { Booking } from './booking.entity';

@Injectable()
export class BookingValidator {
  /**
   * Validates the booking size, ensurin no more than 5 people are booked at a time
   *
   * @throws if booking size exceeds limits
   */
  validateBookingSize(size: number): void {
    const MIN_BOOKING_SIZE = 1;
    const MAX_BOOKING_SIZE = 5;

    if (size < MIN_BOOKING_SIZE) {
      throw new Error('Cannot book less than 1 seat');
    }

    if (size > MAX_BOOKING_SIZE) {
      throw new Error(`Cannot book more than ${MAX_BOOKING_SIZE} seats`);
    }
  }

  /**
   * Validates that a booking is not expired
   *
   * @param booking booking to check
   * @throws {Error} if booking expired
   */
  validateBookingNotExpired(booking: Partial<Booking>): void {
    if (new Date() > booking.expirationTime) {
      throw new Error('Booking expired');
    }
  }
}
