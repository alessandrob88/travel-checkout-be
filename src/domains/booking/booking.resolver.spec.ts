import { Test, TestingModule } from '@nestjs/testing';
import { BookingResolver } from './booking.resolver';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './create-booking.dto';
import { BadRequestException } from '@nestjs/common';

describe('BookingResolver', () => {
  let resolver: BookingResolver;

  const mockBookingService = {
    createBooking: jest.fn(),
  };

  const mockBooking = {
    id: '123abc-def00-123abc-def00',
    user: { id: '333abc-def00-123abc-def00', email: 'test@example.com' },
    travelId: '84a8c4d2-7b3e-4b7e-b3d8-4c7e3b7a8d4c',
    selectedSeats: 2,
    expirationTime: '2024-11-26T18:30:00Z',
    status: 'PENDING',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingResolver,
        { provide: BookingService, useValue: mockBookingService },
      ],
    }).compile();

    resolver = module.get<BookingResolver>(BookingResolver);
  });

  it('should call bookingService.createBooking and return the booking', async () => {
    const createBookingDtoInput: CreateBookingDto = {
      userEmail: mockBooking.user.email,
      travelId: mockBooking.travelId,
      selectedSeats: mockBooking.selectedSeats,
    };

    mockBookingService.createBooking.mockResolvedValue(mockBooking);

    const result = await resolver.createBooking(createBookingDtoInput);

    expect(mockBookingService.createBooking).toHaveBeenCalledWith(
      createBookingDtoInput.userEmail,
      createBookingDtoInput.travelId,
      createBookingDtoInput.selectedSeats,
    );

    expect(result).toEqual(mockBooking);
  });

  it('should throw an error if bookingService.createBooking fails', async () => {
    const createBookingDtoInput: CreateBookingDto = {
      userEmail: 'test@example.com',
      travelId: 'travel-id',
      selectedSeats: 2,
    };

    mockBookingService.createBooking.mockRejectedValue(
      new BadRequestException('Error creating booking'),
    );

    await expect(resolver.createBooking(createBookingDtoInput)).rejects.toThrow(
      'Error creating booking',
    );
  });
});
