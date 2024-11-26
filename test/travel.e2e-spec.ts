import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';

import { AppModule } from '../src/app.module';
import { Travel } from '../src/domains/travel/entities/travel.entity';
import { ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from '../src/config/database.config';
import { MoodType } from '../src/domains/travel/entities/mood.entity';

describe('TravelResolver (e2e)', () => {
  let app: INestApplication;
  let travelRepository: Repository<Travel>;

  let travel: Travel;

  const travelTestData = {
    id: '1a2b34cd-5ef6-7a89-01b2-34c5d6e7f8a9',
    slug: 'a-test-travel',
    name: 'A Test Travel',
    description:
      'A test travel description here to explain better a travel experience',
    startingDate: new Date(),
    endingDate: new Date(),
    price: 119900,
    availableSeats: 10,
    totalNumberOfSeats: 20,
    moods: [
      {
        id: 1,
        travel: null,
        mood: MoodType.CULTURE,
        score: 50,
      },
    ],
  };

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

    travelRepository = moduleFixture.get(getRepositoryToken(Travel));

    travel = await travelRepository.save(travelTestData);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Queries', () => {
    it('should fetch travel by ID', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              getTravelById(id: "${travel.id}") {
                id
                name
                availableSeats
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.getTravelById.id).toEqual(travel.id);
      expect(response.body.data.getTravelById.name).toEqual(travel.name);
      expect(response.body.data.getTravelById.availableSeats).toEqual(
        travel.availableSeats,
      );
    });

    it('should return an error for a non-existent travel ID', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              getTravelById(id: "0a0a00aa-0aa0-0a00-00a0-00a0a0a0a0a0") {
                id
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors[0].message).toBe('Travel not found');
    });

    it('should fetch travel by slug', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              getTravelBySlug(slug: "${travel.slug}") {
                id
                name
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.getTravelBySlug.id).toBe(travelTestData.id);
      expect(response.body.data.getTravelBySlug.name).toBe(travelTestData.name);
    });

    it('should return an error for a non-existent slug', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              getTravelBySlug(slug: "non-existent-slug") {
                id
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors[0].message).toBe('Travel not found');
    });

    it('should fetch all travels with pagination', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              getAllTravels(page: 1, pageSize: 10) {
                data {
                  id
                  name
                }
                total
                page
                pageSize
                totalPages
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.getAllTravels.data.length).toBeGreaterThan(0);
      expect(response.body.data.getAllTravels.total).toBe(24);
      expect(response.body.data.getAllTravels.page).toBe(1);
    });
  });

  describe('Mutations', () => {
    it('should increase available seats', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              increaseAvailableSeats(id: "${travel.id}", seats: 5) {
                id
                availableSeats
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.increaseAvailableSeats.availableSeats).toBe(15);
    });

    it('should decrease available seats', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              decreaseAvailableSeats(id: "${travel.id}", seats: 5) {
                id
                availableSeats
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.data.decreaseAvailableSeats.availableSeats).toBe(10);
    });

    it('should return an error when decreasing available seats below 0', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              decreaseAvailableSeats(id: "${travel.id}", seats: 20) {
                id
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors[0].message).toBe(
        'Not enough available seats',
      );
    });
  });
});
