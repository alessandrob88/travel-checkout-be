import { Injectable } from '@nestjs/common';
import { Travel } from './entities/travel.entity';

@Injectable()
export class TravelValidator {
  /**
   * Validates changes to the available number seats of a travel.
   *
   * If the change would exceed the total number of seats or create negative availability,
   * throw an error.
   *
   * @throws Error if the change is invalid.
   */
  validateSeatUpdate(travel: Travel, delta: number): void {
    const newAvailableSeats = travel.availableSeats + delta;

    if (delta > 0 && newAvailableSeats > travel.totalNumberOfSeats) {
      throw new Error('Cannot increase available seats beyond total seats');
    } else if (delta < 0 && newAvailableSeats < 0) {
      throw new Error('Not enough available seats');
    }
  }
}
