import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Travel } from './entities/travel.entity';
import { PaginationResponse } from 'src/shared/types/paginationResponse.type';

@Injectable()
export class TravelService {
  constructor(
    @InjectRepository(Travel)
    private travelRepository: Repository<Travel>,
  ) {}

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
    const skip = (page - 1) * pageSize;

    const [travels, total] = await this.travelRepository.findAndCount({
      skip,
      take: pageSize,
      relations: ['moods'],
    });

    return {
      data: travels,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Retrieves a travel entity by its unique identifier
   *
   * @param id Travel entity unique identifier
   * @returns A promise that resolves to the travel entity if found,
   * null otherwise.
   */
  async getTravelById(id: string): Promise<Travel> {
    return await this.travelRepository.findOne({
      where: { id },
      relations: ['moods'],
    });
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
   * Increases or decreases the number of available seats for a given travel entity.
   *
   * @param travelId Travel entity unique identifier
   * @param delta The number of seats to increase (positive value) or decrease (negative value).
   * @returns A promise that resolves to the updated travel entity.
   * @throws An error if the travel entity is not found.
   */
  private async updateAvailableSeats(
    travelId: string,
    delta: number,
  ): Promise<Travel> {
    const travel = await this.getTravelById(travelId);
    if (!travel) throw new Error('Travel not found');

    travel.availableSeats += delta;
    return this.travelRepository.save(travel);
  }
}
