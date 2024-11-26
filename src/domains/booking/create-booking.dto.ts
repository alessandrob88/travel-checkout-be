import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateBookingDto {
  @Field()
  userEmail: string;

  @Field()
  travelId: string;

  @Field()
  selectedSeats: number;
}
