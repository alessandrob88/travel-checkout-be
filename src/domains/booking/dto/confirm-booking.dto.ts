import { ArgsType, Field } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@ArgsType()
export class ConfirmBookingDto {
  @Field()
  @IsUUID()
  bookingId: string;
}
