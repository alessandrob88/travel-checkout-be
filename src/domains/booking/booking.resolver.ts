import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './create-booking.dto';
import { BookingGraphQL } from './booking.model';

@Resolver(() => BookingGraphQL)
export class BookingResolver {
  constructor(private readonly bookingService: BookingService) {}

  /**
   * Creates a new booking based on the provided booking input data
   *
   * @param createBookingDtoInput data transfer object containing booking input details such as user email, travel ID, and selected seats
   * @returns promise that resolves to the created booking in GraphQL format
   */
  @Mutation(() => BookingGraphQL)
  async createBooking(
    @Args('createBookingInput') createBookingDtoInput: CreateBookingDto,
  ): Promise<BookingGraphQL> {
    return this.bookingService.createBooking(
      createBookingDtoInput.userEmail,
      createBookingDtoInput.travelId,
      createBookingDtoInput.selectedSeats,
    );
  }

  /**
   * Confirms a booking by its identifier
   *
   * @param bookingId the identifier of the booking to confirm
   * @returns A promise that resolves to the confirmed booking in GraphQL format
   * @throws {NotFoundException} If the booking is not found
   * @throws {BadRequestException} If the booking is not in a confirmable state
   * @throws {Error} If payment processing fails
   */
  async confirmBooking(
    @Args('bookingId') bookingId: string,
  ): Promise<BookingGraphQL> {
    return this.bookingService.confirmBooking(bookingId);
  }
}
