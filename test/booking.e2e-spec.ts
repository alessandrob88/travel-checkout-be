import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { AppModule } from '../src/app.module';
import { BookingStatus } from '../src/domains/booking/booking.entity';
import { getTypeOrmConfig } from '../src/config/database.config';
import { runSeed, truncateSeed } from './utils';

describe('BookingResolver (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

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

    dataSource = moduleFixture.get<DataSource>(DataSource);

    truncateSeed();
    runSeed();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('createBooking', () => {
    it('should not book a travel with a negative number of seats', async () => {
      // Seed data assumption:
      // - User with email "mario.rossi@gmail.foo" exists
      // - Travel with ID "f8e44e7b-1427-4a9a-8705-c16d79b23e62" exists.
      const createBookingInput = {
        userEmail: 'mario.rossi@gmail.foo',
        travelId: 'f8e44e7b-1427-4a9a-8705-c16d79b23e62',
        selectedSeats: -1,
      };

      const mutation = `
        mutation CreateBooking($createBookingInput: CreateBookingDto!) {
          createBooking(createBookingInput: $createBookingInput) {
            id
            user {
              id
              email
            }
            travel {
              id
              slug
              name
            }
            selectedSeats
            totalPrice
            expirationTime
            status
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { createBookingInput },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe(
        'Cannot book less than 1 seat',
      );
    });

    it('should create a booking successfully', async () => {
      // Seed data assumption:
      // - User with email "luigi.verdi@gmail.bar" exists
      // - Travel with ID "d408be33-aa6a-4c73-a2c8-58a70ab2ba4d" exists.
      const createBookingInput = {
        userEmail: 'luigi.verdi@gmail.bar',
        travelId: 'd408be33-aa6a-4c73-a2c8-58a70ab2ba4d',
        selectedSeats: 2,
      };

      const mutation = `
        mutation CreateBooking($createBookingInput: CreateBookingDto!) {
          createBooking(createBookingInput: $createBookingInput) {
            id
            user {
              id
              email
            }
            travel {
              id
              slug
              name
            }
            selectedSeats
            totalPrice
            expirationTime
            status
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { createBookingInput },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.createBooking).toEqual({
        id: expect.any(String),
        user: {
          id: expect.any(String),
          email: createBookingInput.userEmail,
        },
        travel: {
          id: createBookingInput.travelId,
          slug: expect.any(String),
          name: expect.any(String),
        },
        selectedSeats: 2,
        expirationTime: expect.any(String),
        status: BookingStatus.PENDING,
        totalPrice: 399800,
      });

      const booking = await dataSource.getRepository('Booking').findOne({
        where: { id: response.body.data.createBooking.id },
        relations: ['user', 'travel'],
      });

      expect(booking).toBeDefined();
      expect(booking?.user.email).toBe(createBookingInput.userEmail);
      expect(booking?.travel.id).toBe(createBookingInput.travelId);
      expect(booking?.selectedSeats).toBe(createBookingInput.selectedSeats);
    });

    it('should return an error if the user tries to book the same travel again (and previous booking is in pending state', async () => {
      // Seed data assumption:
      // - User with email "luigi.verdi@gmail.bar" exists
      // - Travel with ID "d408be33-aa6a-4c73-a2c8-58a70ab2ba4d" exists.
      const createBookingInput = {
        userEmail: 'luigi.verdi@gmail.bar',
        travelId: 'd408be33-aa6a-4c73-a2c8-58a70ab2ba4d',
        selectedSeats: 2,
      };

      const mutation = `
        mutation CreateBooking($createBookingInput: CreateBookingDto!) {
          createBooking(createBookingInput: $createBookingInput) {
            id
            user {
              id
              email
            }
            travel {
              id
              slug
              name
            }
            selectedSeats
            totalPrice
            expirationTime
            status
          }
        }
      `;

      // Second booking attempt with the same data of the previous use case
      const secondResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { createBookingInput },
        });

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.errors).toBeDefined();
      expect(secondResponse.body.errors[0].message).toBe(
        'You already have a pending booking for this travel',
      );

      const bookings = await dataSource.getRepository('Booking').find({
        where: {
          user: { email: createBookingInput.userEmail },
          travel: { id: createBookingInput.travelId },
        },
      });

      expect(bookings.length).toBe(1);
    });

    it('should not book a travel with more seats than available', async () => {
      // Seed data assumption:
      // - User with email "mario.rossi@gmail.foo" exists
      // - Travel with ID "d408be33-aa6a-4c73-a2c8-58a70ab2ba4d" exists.
      const createBookingInput = {
        userEmail: 'mario.rossi@gmail.foo',
        travelId: 'de31b2c1-ff99-4f88-83ed-5251a9c6841d',
        selectedSeats: 2,
      };

      const mutation = `
        mutation CreateBooking($createBookingInput: CreateBookingDto!) {
          createBooking(createBookingInput: $createBookingInput) {
            id
            user {
              id
              email
            }
            travel {
              id
              slug
              name
            }
            selectedSeats
            totalPrice
            expirationTime
            status
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { createBookingInput },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe(
        'Not enough available seats',
      );
    });

    it('should not book a travel that does not exist', async () => {
      const createBookingInput = {
        userEmail: 'mario.rossi@gmail.foo',
        travelId: 'de31b2c1-ff99-4f88-83ed-5251a9c6841c',
        selectedSeats: 2,
      };

      const mutation = `
        mutation CreateBooking($createBookingInput: CreateBookingDto!) {
          createBooking(createBookingInput: $createBookingInput) {
            id
            user {
              id
              email
            }
            travel {
              id
              slug
              name
            }
            selectedSeats
            totalPrice
            expirationTime
            status
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { createBookingInput },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Travel not found');

      const bookings = await dataSource.getRepository('Booking').find({
        where: {
          user: { email: createBookingInput.userEmail },
          travel: { id: createBookingInput.travelId },
        },
      });

      expect(bookings.length).toBe(0);
    });
  });

  describe('confirmBooking', () => {
    it('should confirm a booking successfully', async () => {
      // seed data assumption:
      // - luigi.verdi@gmail.bar exists
      // - at least a booking for luigi.verdi@gmail.bar exists
      const { id: bookingId } = await dataSource
        .getRepository('Booking')
        .findOne({
          where: { user: { email: 'luigi.verdi@gmail.bar' } },
        });

      const mutation = `
        mutation ConfirmBooking($bookingId: String!) {
          confirmBooking(bookingId: $bookingId) {
            id
            status
            user {
              id
              email
            }
            travel {
              id
              name
              slug
            }
            totalPrice
            selectedSeats
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { bookingId },
        });

      expect(response.status).toBe(200);

      expect(response.body.data.confirmBooking).toEqual({
        id: bookingId,
        status: BookingStatus.CONFIRMED,
        totalPrice: 399800,
        user: {
          id: expect.any(String),
          email: expect.any(String),
        },
        travel: {
          id: expect.any(String),
          name: expect.any(String),
          slug: expect.any(String),
        },
        selectedSeats: expect.any(Number),
      });

      // Verify database state
      const booking = await dataSource.getRepository('Booking').findOne({
        where: { id: bookingId },
        relations: ['user', 'travel'],
      });

      expect(booking).toBeDefined();
      expect(booking?.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should return an error if the booking does not exist', async () => {
      const invalidBookingId = '00000000-4c4e-46b6-9719-21bc9bc3e4e2';

      const mutation = `
        mutation ConfirmBooking($bookingId: String!) {
          confirmBooking(bookingId: $bookingId) {
            id
            status
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { bookingId: invalidBookingId },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Booking not found');
    });

    it('should return an error if the booking is not in a confirmable state', async () => {
      const bookingInANotConfirmableState =
        'f92f7d85-012b-4f0f-b0df-48f0dfc1db17';
      const mutation = `
        mutation ConfirmBooking($bookingId: String!) {
          confirmBooking(bookingId: $bookingId) {
            id
            status
          }
        }
      `;
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { bookingId: bookingInANotConfirmableState },
        });
      console.log(response.error);
      console.log(response.body);
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe(
        'Booking is not in a confirmable state',
      );
    });

    it('should return an error if booking expired', async () => {
      // seed data assumption:
      // - booking expired with ID "c92f7d85-012b-4f0f-b0df-48f0dfc1db17" exists from seed data
      const expiredBookingId = 'c92f7d85-012b-4f0f-b0df-48f0dfc1db17';

      const mutation = `
        mutation ConfirmBooking($bookingId: String!) {
          confirmBooking(bookingId: $bookingId) {
            id
            status
          }
        }
      `;
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: mutation,
          variables: { bookingId: expiredBookingId },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toBe('Booking expired');
    });
  });
});
