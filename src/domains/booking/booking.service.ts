import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { TravelService } from '../travel/travel.service';
import { Booking, BookingStatus } from './booking.entity';
import { BookingValidator } from './booking.validator';
import { PaymentService } from '../payment/payment.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    private userService: UserService,
    private travelService: TravelService,
    private bookingValidator: BookingValidator,
    private paymentService: PaymentService,
  ) {}

  /**
   * Creates a new booking
   * @param userId identifier of user making the booking
   * @param travelId identifier of travel being booked
   * @param selectedSeats Number of seats to book
   * @returns created booking
   * @throws {BadRequestException} if the booking is invalid.
   */
  async createBooking(
    userEmail: string,
    travelId: string,
    selectedSeats: number,
  ): Promise<Booking> {
    this.bookingValidator.validateBookingSize(selectedSeats);

    const user = await this.userService.createUserIfNotExists(userEmail);

    // note: if travel is not found execution will throw an exception
    // is an edge case that should never happen in practice
    // user above is anyway created and will be used for next bookings
    const travel = await this.travelService.getTravelById(travelId);

    const pendingBooking = await this.bookingRepository.findOne({
      where: {
        user: { id: user.id },
        travel: { id: travelId },
        status: BookingStatus.PENDING,
      },
    });

    if (pendingBooking) {
      throw new BadRequestException(
        'You already have a pending booking for this travel',
      );
    }

    await this.travelService.decreaseAvailableSeats(travelId, selectedSeats);

    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 15);

    const booking = this.bookingRepository.create({
      user,
      travel,
      selectedSeats,
      totalPrice: travel.price * selectedSeats,
      expirationTime,
      status: BookingStatus.PENDING,
    });

    return this.bookingRepository.save(booking);
  }

  /**
   * Confirms a booking with payment side effect
   *
   * @param bookingId identifier of the booking
   * @throws {BadRequestException} if the booking is not in a confirmable state
   * @throws {NotFoundException} if the booking is not found
   * @throws {Error} if payment fails TODO: final version yet to implement
   * @returns confirmed booking
   */
  async confirmBooking(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['travel', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    this.bookingValidator.validateBookingNotExpired(booking);

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not in a confirmable state');
    }

    // TODO: this should be refactored because payment step is not implemented
    const paymentSuccess = await this.paymentService.processPayment(
      booking.totalPrice,
    );
    if (!paymentSuccess) {
      throw new Error('Payment failed');
    }

    return this.bookingRepository.save({
      ...booking,
      status: BookingStatus.CONFIRMED,
    });
  }

  /**
   * This function is executed every 5 minutes by a cron job.
   * It finds all bookings that are in pending status and are expired,
   * updates their status to "expired" and resets the number of reserved seats
   * of the associated travel.
   */
  @Cron('*/5 * * * *')
  async handleExpiredBookings(): Promise<void> {
    console.log('cron:::::::start');
    const now = new Date();
    const expiredBookings = await this.bookingRepository.find({
      where: {
        status: BookingStatus.PENDING,
        expirationTime: LessThan(now),
      },
      relations: ['travel'],
    });

    for (const booking of expiredBookings) {
      await this.bookingRepository.update(booking.id, {
        status: BookingStatus.EXPIRED,
      });

      await this.travelService.increaseAvailableSeats(
        booking.travel.id,
        booking.selectedSeats,
      );
    }
    console.log('cron:::::::end');
  }

  /**
   * Updates the status of the booking with the given id
   *
   * @param bookingId the id of the booking
   * @param status the new status of the booking
   */
  async updateStatus(bookingId: string, status: BookingStatus): Promise<void> {
    await this.bookingRepository.update(bookingId, { status });
  }
}
