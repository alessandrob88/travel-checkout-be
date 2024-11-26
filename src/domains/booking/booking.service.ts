import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { TravelService } from '../travel/travel.service';
import { Booking, BookingStatus } from './booking.entity';
import { BookingValidator } from './booking.validator';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    private userService: UserService,
    private travelService: TravelService,
    private bookingValidator: BookingValidator,
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

    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 15);

    await this.travelService.decreaseAvailableSeats(travelId, selectedSeats);

    const booking = this.bookingRepository.create({
      user,
      travel,
      selectedSeats,
      expirationTime,
      status: BookingStatus.PENDING,
    });

    return this.bookingRepository.save(booking);
  }
}
