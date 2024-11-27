import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { UserService } from '../user/user.service';
import { TravelService } from '../travel/travel.service';
import { Booking, BookingStatus } from './booking.entity';
import { BookingValidator } from './booking.validator';
import { Repository } from 'typeorm';
import { Travel } from '../travel/entities/travel.entity';
import { PaymentService } from '../payment/payment.service';

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
  totalPrice: 20000,
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
  find: jest.fn(),
  update: jest.fn(),
};

const mockTravelService = {
  getTravelById: jest.fn().mockResolvedValue(mockTravel),
  decreaseAvailableSeats: jest.fn(),
  increaseAvailableSeats: jest.fn(),
};

const mockBookingValidator = {
  validateBookingSize: jest.fn(),
  validateBookingNotExpired: jest.fn(),
};

const mockPaymentService = { processPayment: jest.fn().mockReturnValue(true) };

describe('BookingService', () => {
  let bookingService: BookingService;
  let travelService: TravelService;
  let bookingValidator: BookingValidator;
  let bookingRepository: jest.Mocked<Repository<Booking>>;
  let userService: UserService;
  let paymentService: PaymentService;

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
        { provide: PaymentService, useValue: mockPaymentService },
      ],
    }).compile();

    bookingService = module.get<BookingService>(BookingService);
    travelService = module.get<TravelService>(TravelService);
    bookingValidator = module.get<BookingValidator>(BookingValidator);
    bookingRepository = module.get(getRepositoryToken(Booking));
    userService = module.get<UserService>(UserService);
    paymentService = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
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
        totalPrice: mockBooking.totalPrice,
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
      bookingValidator.validateBookingSize = jest
        .fn()
        .mockImplementation(() => {
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

  describe('confirmBooking', () => {
    it('should throw a NotFoundException if the booking is not found', async () => {
      bookingRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        bookingService.confirmBooking('000abc-def99-123abc-def00'),
      ).rejects.toThrow('Booking not found');

      expect(bookingRepository.findOne).toHaveBeenCalledWith({
        relations: ['travel', 'user'],
        where: { id: '000abc-def99-123abc-def00' },
      });
    });

    it('should throw a BadRequestException if the booking is not in a confirmable state', async () => {
      bookingRepository.findOne.mockResolvedValueOnce({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      await expect(
        bookingService.confirmBooking(mockBooking.id),
      ).rejects.toThrow('Booking is not in a confirmable state');

      expect(bookingRepository.findOne).toHaveBeenCalledWith({
        relations: ['travel', 'user'],
        where: { id: mockBooking.id },
      });
    });

    it('should throw an error if booking has expired', async () => {
      bookingRepository.findOne.mockResolvedValueOnce({
        ...mockBooking,
        expirationTime: new Date(0),
      });

      bookingValidator.validateBookingNotExpired = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error('Booking expired');
        });

      await expect(
        bookingService.confirmBooking(mockBooking.id),
      ).rejects.toThrow('Booking expired');

      expect(bookingValidator.validateBookingNotExpired).toHaveBeenCalledWith({
        ...mockBooking,
        expirationTime: new Date(0),
      });

      expect(bookingRepository.findOne).toHaveBeenCalledWith({
        relations: ['travel', 'user'],
        where: { id: mockBooking.id },
      });
    });

    it('should throw an error if payment fails', async () => {
      bookingRepository.findOne.mockResolvedValueOnce(mockBooking);
      paymentService.processPayment = jest.fn().mockReturnValueOnce(false);

      await expect(
        bookingService.confirmBooking(mockBooking.id),
      ).rejects.toThrow('Payment failed');

      expect(paymentService.processPayment).toHaveBeenCalledWith(
        mockBooking.travel.price * mockBooking.selectedSeats,
      );
    });
  });

  describe('handleExpiredBookings', () => {
    const now = new Date();
    const expiredBookings = [
      {
        id: '000abc-def99-123abc-def00',
        user: mockUser,
        travel: mockTravel,
        selectedSeats: 2,
        totalPrice: 20000,
        status: BookingStatus.PENDING,
        expirationTime: new Date(now.getTime() - 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '000abc-def99-123abc-def01',
        user: mockUser,
        travel: mockTravel,
        selectedSeats: 4,
        totalPrice: 20000,
        status: BookingStatus.PENDING,
        expirationTime: new Date(now.getTime() - 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should handle expired bookings by updating their status and increasing travel seats', async () => {
      bookingRepository.find.mockResolvedValueOnce(expiredBookings);

      await bookingService.handleExpiredBookings();

      expect(bookingRepository.find).toHaveBeenCalledWith({
        where: {
          status: BookingStatus.PENDING,
          expirationTime: expect.any(Object),
        },
        relations: ['travel'],
      });

      expect(bookingRepository.update).toHaveBeenCalledTimes(2);
      expect(bookingRepository.update).toHaveBeenCalledWith(
        '000abc-def99-123abc-def00',
        { status: BookingStatus.EXPIRED },
      );
      expect(bookingRepository.update).toHaveBeenCalledWith(
        '000abc-def99-123abc-def01',
        { status: BookingStatus.EXPIRED },
      );

      expect(travelService.increaseAvailableSeats).toHaveBeenCalledTimes(2);
      expect(travelService.increaseAvailableSeats).toHaveBeenCalledWith(
        mockTravel.id,
        2,
      );
      expect(travelService.increaseAvailableSeats).toHaveBeenCalledWith(
        mockTravel.id,
        4,
      );
    });

    it('should do nothing if there are no expired bookings', async () => {
      bookingRepository.find.mockResolvedValueOnce([]);

      await bookingService.handleExpiredBookings();

      expect(bookingRepository.update).not.toHaveBeenCalled();
      expect(travelService.increaseAvailableSeats).not.toHaveBeenCalled();
    });
  });
});
