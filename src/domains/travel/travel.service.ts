import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../shared/base/base.service';
import { Travel } from './entities/travel.entity';
import { PaginationResponse } from '../../shared/types/paginationResponse.type';
import { TravelValidator } from './travel.validator';

@Injectable()
export class TravelService extends BaseService<Travel> {
  constructor(
    @InjectRepository(Travel)
    private travelRepository: Repository<Travel>,
    private travelValidator: TravelValidator,
  ) {
    super(travelRepository);
  }

  /**
   * Retrieves a paginated list of Travel entities.
   *
   * @param page The page number to return (1-indexed).
   * @param pageSize The number of items per page.
   * @returns A paginated list of travels.
   */
  async getAllTravels(
    page: number,
    pageSize: number,
  ): Promise<PaginationResponse<Travel>> {
    if (page < 1) {
      throw new Error('Page must be a positive number');
    }
    if (pageSize < 1) {
      throw new Error('Page size must be a positive number');
    }
    return this.getAllWithPagination(page, pageSize, { relations: ['moods'] });
  }

  /**
   * Retrieves a travel entity by its unique identifier
   *
   * @param id Travel entity unique identifier
   * @returns A promise that resolves to the travel entity if found
   * @throws {NotFoundException} if travel entity is not found
   */
  async getTravelById(id: string): Promise<Travel> {
    const travel = await this.travelRepository.findOne({
      where: { id },
      relations: ['moods'],
    });

    if (!travel) {
      throw new NotFoundException('Travel not found');
    }

    return travel;
  }

  /**
   * Retrieves a travel entity by its slug
   *
   * @param slug Travel entity slug
   * @returns A promise that resolves to the travel entity if found
   * @throws {NotFoundException} if travel entity is not found
   */
  async getTravelBySlug(slug: string): Promise<Travel> {
    const travel = await this.travelRepository.findOne({
      where: { slug },
      relations: ['moods'],
    });

    if (!travel) {
      throw new NotFoundException('Travel not found');
    }

    return travel;
  }

  /**
   * Increases number of available seats for a given travel entity.
   *
   * @param travelId travel entity identifier
   * @param seats The number of seats to increase.
   * @returns A promise that resolves to the updated travel entity.
   */
  async increaseAvailableSeats(
    travelId: string,
    seats: number,
  ): Promise<Travel> {
    return this.updateAvailableSeats(travelId, seats);
  }

  /**
   * Decreases number of available seats for a given travel entity
   *
   * @param travelId travel entity identifier
   * @param seats The number of seats to decrease
   * @returns A promise that resolves to the updated travel entity.
   * @throws An error if the travel entity is not found.
   */
  async decreaseAvailableSeats(
    travelId: string,
    seats: number,
  ): Promise<Travel> {
    return this.updateAvailableSeats(travelId, -seats);
  }

  /**
   * Updates the number of available seats for a given travel
   *
   * @param travelId travel entity identifier
   * @param delta The number of seats to add (positive) or remove (negative)
   * @returns A promise that resolves to the updated travel entity
   * @throws An error if the travel entity is not found
   */
  private async updateAvailableSeats(
    travelId: string,
    delta: number,
  ): Promise<Travel> {
    const queryRunner =
      this.travelRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const travel = await queryRunner.manager.findOne(Travel, {
        where: { id: travelId },
      });
      if (!travel) {
        throw new NotFoundException('Travel not found');
      }

      this.travelValidator.validateSeatUpdate(travel, delta);
      travel.availableSeats = travel.availableSeats + delta;

      const updatedTravel = await queryRunner.manager.save(Travel, travel);
      await queryRunner.commitTransaction();

      return updatedTravel;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
