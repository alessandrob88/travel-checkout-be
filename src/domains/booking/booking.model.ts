import { ObjectType, Field } from '@nestjs/graphql';
import { UserGraphQL } from '../user/user.model';
import { TravelGraphQL } from '../travel/models/travel.model';

@ObjectType()
export class BookingGraphQL {
  @Field()
  id: string;

  @Field(() => UserGraphQL)
  user: UserGraphQL;

  @Field(() => TravelGraphQL)
  travel: TravelGraphQL;

  @Field()
  selectedSeats: number;

  @Field()
  expirationTime: Date;

  @Field()
  status: string;
}
