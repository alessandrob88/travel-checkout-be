import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { MoodType } from '../entities/mood.entity';
@ObjectType()
export class MoodGraphQL {
  @Field(() => ID)
  id: number;

  @Field(() => MoodType)
  mood: MoodType;

  @Field(() => Int)
  score: number;
}

registerEnumType(MoodType, {
  name: 'MoodType',
  description: 'Mood types to explain better a travel experience',
});
