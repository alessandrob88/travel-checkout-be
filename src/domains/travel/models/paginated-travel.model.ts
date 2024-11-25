import { ObjectType, Field, Int } from '@nestjs/graphql';
import { TravelGraphQL } from './travel.model';

@ObjectType()
export class PaginatedTravelGraphQL {
  @Field(() => [TravelGraphQL])
  data: TravelGraphQL[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pageSize: number;

  @Field(() => Int)
  totalPages: number;
}
