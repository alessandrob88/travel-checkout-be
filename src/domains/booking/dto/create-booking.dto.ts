import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsUUID, IsInt, IsPositive } from 'class-validator';

@InputType()
export class CreateBookingDto {
  @Field()
  @IsEmail()
  userEmail: string;

  @Field()
  @IsUUID()
  travelId: string;

  @Field()
  @IsInt()
  @IsPositive()
  selectedSeats: number;
}
