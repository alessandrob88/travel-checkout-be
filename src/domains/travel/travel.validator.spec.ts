import { TravelValidator } from './travel.validator';

describe('TravelValidator', () => {
  let travelValidator: TravelValidator;

  beforeEach(() => {
    travelValidator = new TravelValidator();
  });

  it('should be defined', () => {
    expect(travelValidator).toBeDefined();
  });

  it('should throw an error if available seats exceed total when increasing', () => {
    const travel = { availableSeats: 5, totalNumberOfSeats: 10 } as any;

    expect(() => travelValidator.validateSeatUpdate(travel, 6)).toThrow(
      'Cannot increase available seats beyond total seats',
    );
  });

  it('should throw an error if available seats go below zero when decreasing', () => {
    const travel = { availableSeats: 5, totalNumberOfSeats: 10 } as any;

    expect(() => travelValidator.validateSeatUpdate(travel, -6)).toThrow(
      'Not enough available seats',
    );
  });

  it("should throw an error if available seats are 0 and it's tried to decrease", () => {
    const travel = { availableSeats: 0, totalNumberOfSeats: 10 } as any;

    expect(() => travelValidator.validateSeatUpdate(travel, -1)).toThrow(
      'Not enough available seats',
    );
  });

  it('should not throw an error if the number of available seats are in valid range when increasing', () => {
    const travel = { availableSeats: 5, totalNumberOfSeats: 10 } as any;

    expect(() => travelValidator.validateSeatUpdate(travel, 4)).not.toThrow();
  });

  it('should not throw an error if the number of available seats are in valid range when decreasing', () => {
    const travel = { availableSeats: 5, totalNumberOfSeats: 10 } as any;

    expect(() => travelValidator.validateSeatUpdate(travel, -4)).not.toThrow();
  });

  it('should not throw an error if the number of available seats is exactly at the total number of seats', () => {
    const travel = { availableSeats: 10, totalNumberOfSeats: 10 } as any;

    expect(() => travelValidator.validateSeatUpdate(travel, 0)).not.toThrow();
    expect(() => travelValidator.validateSeatUpdate(travel, -1)).not.toThrow();
  });

  it('should not throw an error if available seats are updated within valid range (no boundary issues)', () => {
    const travel = { availableSeats: 5, totalNumberOfSeats: 10 } as any;

    expect(() => travelValidator.validateSeatUpdate(travel, 2)).not.toThrow();
    expect(() => travelValidator.validateSeatUpdate(travel, -2)).not.toThrow();
  });

  it('should throw an error when the total seats is zero and we try to increase seats', () => {
    const travel = { availableSeats: 0, totalNumberOfSeats: 0 } as any;

    expect(() => travelValidator.validateSeatUpdate(travel, 1)).toThrow(
      'Cannot increase available seats beyond total seats',
    );
  });

  it('should not throw an error when both available seats and total seats are zero and no change is made', () => {
    const travel = { availableSeats: 0, totalNumberOfSeats: 0 } as any;

    expect(() => travelValidator.validateSeatUpdate(travel, 0)).not.toThrow();
  });

  it('should throw an error if the available seats go negative when updating with negative delta', () => {
    const travel = { availableSeats: 0, totalNumberOfSeats: 5 } as any;

    expect(() => travelValidator.validateSeatUpdate(travel, -1)).toThrow(
      'Not enough available seats',
    );
  });

  it('should handle edge cases with boundary values', () => {
    const travel = { availableSeats: 0, totalNumberOfSeats: 1000 } as any;

    expect(() => travelValidator.validateSeatUpdate(travel, -1)).toThrow(
      'Not enough available seats',
    );

    expect(() => travelValidator.validateSeatUpdate(travel, 1001)).toThrow(
      'Cannot increase available seats beyond total seats',
    );
  });

  it('should handle large numbers of seats correctly', () => {
    const travel = { availableSeats: 500, totalNumberOfSeats: 1000000 } as any;

    expect(() => travelValidator.validateSeatUpdate(travel, 100)).not.toThrow();

    expect(() =>
      travelValidator.validateSeatUpdate(travel, -100),
    ).not.toThrow();

    expect(() => travelValidator.validateSeatUpdate(travel, 999501)).toThrow(
      'Cannot increase available seats beyond total seats',
    );

    expect(() => travelValidator.validateSeatUpdate(travel, -600)).toThrow(
      'Not enough available seats',
    );
  });
});
