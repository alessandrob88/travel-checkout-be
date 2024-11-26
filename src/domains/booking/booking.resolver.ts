import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './create-booking.dto';
import { BookingGraphQL } from './booking.model';

@Resolver(() => BookingGraphQL)
export class BookingResolver {
  constructor(private readonly bookingService: BookingService) {}

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
}
