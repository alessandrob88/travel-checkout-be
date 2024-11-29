import { IsString } from 'class-validator';
import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class GetTravelByIdInput {
  @Field()
  @IsString()
  id: string;
}
