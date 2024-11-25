import { Repository } from 'typeorm';
import { PaginationResponse } from '../types/paginationResponse.type';

export abstract class BaseService<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async getAllWithPagination(
    page: number,
    pageSize: number,
    options?: { relations?: string[] },
  ): Promise<PaginationResponse<T>> {
    const skip = (page - 1) * pageSize;

    const [data, total] = await this.repository.findAndCount({
      skip,
      take: pageSize,
      relations: options?.relations,
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
