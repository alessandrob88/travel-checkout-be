import { BookingValidator } from './booking.validator';

describe('BookingValidator', () => {
  let bookingValidator: BookingValidator;

  beforeEach(() => {
    bookingValidator = new BookingValidator();
  });

  describe('validateBookingSize', () => {
    it('should not throw an error for a valid booking size within the limit', () => {
      expect(() => bookingValidator.validateBookingSize(1)).not.toThrow();
      expect(() => bookingValidator.validateBookingSize(3)).not.toThrow();
      expect(() => bookingValidator.validateBookingSize(5)).not.toThrow();
    });

    it('should throw an error for a booking size exceeding the limit', () => {
      expect(() => bookingValidator.validateBookingSize(6)).toThrow(
        'Cannot book more than 5 seats',
      );
      expect(() => bookingValidator.validateBookingSize(10)).toThrow(
        'Cannot book more than 5 seats',
      );
    });

    it('should throw an error for a booking size of 0', () => {
      expect(() => bookingValidator.validateBookingSize(0)).toThrow(
        'Cannot book less than 1 seat',
      );
    });

    it('should throw an error for a negative booking size', () => {
      expect(() => bookingValidator.validateBookingSize(-1)).toThrow(
        'Cannot book less than 1 seat',
      );
    });

    it('should handle large invalid booking sizes correctly', () => {
      expect(() => bookingValidator.validateBookingSize(100)).toThrow(
        'Cannot book more than 5 seats',
      );
    });
  });

  describe('validateBookingNotExpired', () => {
    it('should not throw an error if booking is not expired', () => {
      const validBooking = {
        expirationTime: new Date(Date.now() + 1000 * 60 * 60),
      }; // 1 hour from now
      expect(() =>
        bookingValidator.validateBookingNotExpired(validBooking),
      ).not.toThrow();
    });

    it('should throw an error if booking is expired', () => {
      const expiredBooking = {
        expirationTime: new Date(Date.now() - 1000 * 60 * 60),
      }; // 1 hour ago
      expect(() =>
        bookingValidator.validateBookingNotExpired(expiredBooking),
      ).toThrow('Booking expired');
    });

    it('should throw an error if booking expires at the current time', () => {
      const expiredAtNowBooking = { expirationTime: new Date(Date.now() - 1) };
      expect(() =>
        bookingValidator.validateBookingNotExpired(expiredAtNowBooking),
      ).toThrow('Booking expired');
    });
  });
});
