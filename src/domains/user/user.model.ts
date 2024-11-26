import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class UserGraphQL {
  @Field()
  id: string;

  @Field()
  email: string;
}
