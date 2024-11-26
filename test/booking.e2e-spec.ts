import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { AppModule } from '../src/app.module';
import { BookingStatus } from '../src/domains/booking/booking.entity';
import { getTypeOrmConfig } from '../src/config/database.config';

describe('BookingResolver (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: getTypeOrmConfig, //TODO: use different database
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a booking successfully', async () => {
    // Seed data assumption:
    // - User with email "mario.rossi@gmail.foo" exists
    // - Travel with ID "d408be33-aa6a-4c73-a2c8-58a70ab2ba4d" exists.
    const createBookingInput = {
      userEmail: 'mario.rossi@gmail.foo',
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
          expirationTime
          status
        }
      }
    `;

    const response = await request(app.getHttpServer()).post('/graphql').send({
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

  it('should return an error if the user tries to book the same travel in pending again', async () => {
    // Seed data assumption:
    // - User with email "mario.rossi@gmail.foo" exists
    // - Travel with ID "d408be33-aa6a-4c73-a2c8-58a70ab2ba4d" exists.
    const createBookingInput = {
      userEmail: 'mario.rossi@gmail.foo',
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

  it('should not book a travel with a negative number of seats', async () => {
    // Seed data assumption:
    // - User with email "mario.rossi@gmail.foo" exists
    // - Travel with ID "d408be33-aa6a-4c73-a2c8-58a70ab2ba4d" exists.
    const createBookingInput = {
      userEmail: 'mario.rossi@gmail.foo',
      travelId: 'd408be33-aa6a-4c73-a2c8-58a70ab2ba4d',
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
          expirationTime
          status
        }
      }
    `;

    const response = await request(app.getHttpServer()).post('/graphql').send({
      query: mutation,
      variables: { createBookingInput },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe(
      'Cannot book less than 1 seat',
    );
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
          expirationTime
          status
        }
      }
    `;

    const response = await request(app.getHttpServer()).post('/graphql').send({
      query: mutation,
      variables: { createBookingInput },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toBe('Not enough available seats');
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
          expirationTime
          status
        }
      }
    `;

    const response = await request(app.getHttpServer()).post('/graphql').send({
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
