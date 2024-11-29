import { IsString, ValidateIf } from 'class-validator';
import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class GetTravelBySlugInput {
  @Field()
  @IsString()
  @ValidateIf((_, value) => !!value)
  slug: string;
}
