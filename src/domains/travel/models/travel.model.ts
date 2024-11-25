import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { MoodGraphQL } from './mood.model';

@ObjectType()
export class TravelGraphQL {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  slug: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  description: string;

  @Field(() => Date)
  startingDate: Date;

  @Field(() => Date)
  endingDate: Date;

  @Field(() => Int)
  price: number;

  @Field(() => Int)
  availableSeats: number;

  @Field(() => Int)
  totalNumberOfSeats: number;

  @Field(() => [MoodGraphQL], { nullable: true })
  moods?: MoodGraphQL[];
}
