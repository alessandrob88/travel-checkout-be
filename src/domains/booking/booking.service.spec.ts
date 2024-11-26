import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { UserService } from '../user/user.service';
import { TravelService } from '../travel/travel.service';
import { Booking, BookingStatus } from './booking.entity';
import { BookingValidator } from './booking.validator';
import { Repository } from 'typeorm';
import { Travel } from '../travel/entities/travel.entity';

const mockUser = {
  id: '999abc-def00-123abc-def00',
  email: 'test@example.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTravel: Travel = {
  id: '123abc-def00-123abc-def00',
  name: 'Test Travel',
  slug: 'test-travel',
  description: 'Test description',
  startingDate: new Date(),
  endingDate: new Date(),
  price: 10000,
  availableSeats: 10,
  totalNumberOfSeats: 20,
  moods: [],
};

const mockBooking = {
  id: '000abc-def99-123abc-def00',
  user: mockUser,
  travel: mockTravel,
  selectedSeats: 2,
  status: BookingStatus.PENDING,
  expirationTime: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUserService = {
  createUserIfNotExists: jest.fn().mockResolvedValue(mockUser),
};

const mockBookingRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockTravelService = {
  getTravelById: jest.fn().mockResolvedValue(mockTravel),
};

const mockBookingValidator = { validateBookingSize: jest.fn() };

describe('BookingService', () => {
  let bookingService: BookingService;
  let travelService: TravelService;
  let bookingValidator: BookingValidator;
  let bookingRepository: jest.Mocked<Repository<Booking>>;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        { provide: UserService, useValue: mockUserService },
        { provide: TravelService, useValue: mockTravelService },
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        { provide: BookingValidator, useValue: mockBookingValidator },
      ],
    }).compile();

    bookingService = module.get<BookingService>(BookingService);
    travelService = module.get<TravelService>(TravelService);
    bookingValidator = module.get<BookingValidator>(BookingValidator);
    bookingRepository = module.get(getRepositoryToken(Booking));
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new booking if valid', async () => {
    bookingRepository.create.mockReturnValueOnce(mockBooking);
    bookingRepository.save.mockResolvedValueOnce(mockBooking);

    const result = await bookingService.createBooking(
      mockBooking.user.email,
      mockBooking.travel.id,
      mockBooking.selectedSeats,
    );

    expect(result).toEqual(mockBooking);
    expect(travelService.getTravelById).toHaveBeenCalledWith(
      mockBooking.travel.id,
    );
    expect(bookingValidator.validateBookingSize).toHaveBeenCalledWith(
      mockBooking.selectedSeats,
    );
    expect(userService.createUserIfNotExists).toHaveBeenCalledWith(
      mockBooking.user.email,
    );
    expect(bookingRepository.create).toHaveBeenCalledWith({
      user: mockUser,
      travel: mockTravel,
      selectedSeats: mockBooking.selectedSeats,
      expirationTime: expect.any(Date),
      status: mockBooking.status,
    });
    expect(bookingRepository.save).toHaveBeenCalledWith(mockBooking);
  });

  it('should throw an error if a user already has a pending booking for the same travel', async () => {
    bookingRepository.findOne.mockResolvedValueOnce(mockBooking);

    await expect(
      bookingService.createBooking('test@example.com', 'travelId', 2),
    ).rejects.toThrow('You already have a pending booking for this travel');
  });

  it('should throw an error if booking size is invalid', async () => {
    bookingValidator.validateBookingSize = jest.fn().mockImplementation(() => {
      throw new Error('Invalid booking size');
    });

    await expect(
      bookingService.createBooking(
        mockBooking.user.email,
        mockBooking.travel.id,
        0,
      ),
    ).rejects.toThrow('Invalid booking size');
  });
});
