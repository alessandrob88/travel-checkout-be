import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class GetAllTravelsInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @IsPositive()
  @IsOptional()
  pageSize: number;
}
