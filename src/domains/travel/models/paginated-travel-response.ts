// travels.resolver.ts
import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Travel } from '../entities/travel.entity';

@ObjectType()
export class PaginatedTravelResponse {
  @Field(() => [Travel])
  data: Travel[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pageSize: number;

  @Field(() => Int)
  totalPages: number;
}
