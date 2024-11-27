import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { AppModule } from '../src/app.module';
import { getTypeOrmConfig } from '../src/config/database.config';
import { BookingStatus } from '../src/domains/booking/booking.entity';
import { runSeed, truncateSeed } from './utils';

describe('User Journey Simulation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: getTypeOrmConfig,
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    truncateSeed();
    runSeed();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should simulate a complete user journey', async () => {
    // --- Step 1: Fetch available travels ---

    const travelQuery = `
      query {
        getAllTravels(page: 1, pageSize: 10) {
          data {
            id
            name
            slug
            startingDate
            endingDate
          }
        }
      }
    `;

    const travelResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: travelQuery })
      .expect(200);

    const travels = travelResponse.body.data.getAllTravels.data;
    expect(travels.length).toBeGreaterThan(0);

    const selectedTravel = travels[0];
    const selectedTravelId = selectedTravel.id;

    // --- Step 2: Get more details of a travel ---

    const travelDetailsQuery = `
      query {
        getTravelById(id: "${selectedTravelId}") {
          id
          name
          slug
          startingDate
          endingDate
          availableSeats
          totalNumberOfSeats
          price
          moods {
            mood
            score
          }
        }
      }
    `;

    const travelDetailsResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: travelDetailsQuery })
      .expect(200);

    const travelDetails = travelDetailsResponse.body.data.getTravelById;
    expect(travelDetails).toBeDefined();
    expect(travelDetails.id).toBe(selectedTravelId);
    expect(travelDetails.moods.length).toBeGreaterThan(0);
    expect(travelDetails.moods[0].score).toBeGreaterThan(0);
    expect(travelDetails.availableSeats).toBeGreaterThan(0);
    expect(travelDetails.totalNumberOfSeats).toBeGreaterThan(0);
    expect(travelDetails.price).toBeGreaterThan(0);
    expect(travelDetails.startingDate).toBeDefined();
    expect(travelDetails.endingDate).toBeDefined();

    // --- Step 3: Create a booking for the selected travel ---

    // note: this user should exists in seed data
    const userEmail = 'mario.rossi@gmail.foo';
    const createBookingInput = {
      userEmail,
      travelId: selectedTravelId,
      selectedSeats: 2,
    };

    const bookingMutation = `
      mutation CreateBooking($createBookingInput: CreateBookingDto!) {
        createBooking(createBookingInput: $createBookingInput) {
          id
          user {
            email
          }
          travel {
            id
          }
          selectedSeats
          status
        }
      }
    `;

    const bookingResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: bookingMutation,
        variables: { createBookingInput },
      })
      .expect(200);

    const booking = bookingResponse.body.data.createBooking;
    expect(booking).toBeDefined();
    expect(booking.user.email).toBe(userEmail);
    expect(booking.travel.id).toBe(selectedTravelId);
    expect(booking.status).toBe(BookingStatus.PENDING);

    // --- Step 4: Confirm booking for the selected travel ---

    const confirmBookingMutation = `
      mutation {
        confirmBooking(bookingId: "${booking.id}") {
          id
          status
        }
      }
    `;

    const confirmBookingResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: confirmBookingMutation })
      .expect(200);

    const confirmedBooking = confirmBookingResponse.body.data.confirmBooking;
    expect(confirmedBooking).toBeDefined();
    expect(confirmedBooking.id).toBe(booking.id);
    expect(confirmedBooking.status).toBe(BookingStatus.CONFIRMED);
  });
});
