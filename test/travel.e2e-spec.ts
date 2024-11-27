import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { getTypeOrmConfig } from '../src/config/database.config';
import { runSeed, truncateSeed } from './utils';

describe('TravelResolver (e2e)', () => {
  let app: INestApplication;

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

    truncateSeed();
    runSeed();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Queries', () => {
    it('should fetch travel by ID', async () => {
      const travelId = 'd408be33-aa6a-4c73-a2c8-58a70ab2ba4d';
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              getTravelById(id: "${travelId}") {
                id
                name
                availableSeats
              }
            }
          `,
        })
        .expect(200);

      const { id, name, availableSeats } = response.body.data.getTravelById;
      expect(id).toEqual('d408be33-aa6a-4c73-a2c8-58a70ab2ba4d');
      expect(name).toEqual('Jordan 360°');
      expect(availableSeats).toEqual(10);
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
      const travelSlug = 'jordan-360';
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              getTravelBySlug(slug: "${travelSlug}") {
                id
                name
              }
            }
          `,
        })
        .expect(200);

      const { id, name } = response.body.data.getTravelBySlug;
      expect(id).toBe('d408be33-aa6a-4c73-a2c8-58a70ab2ba4d');
      expect(name).toBe('Jordan 360°');
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

      const { data, total, page, pageSize, totalPages } =
        response.body.data.getAllTravels;
      expect(data.length).toBeGreaterThan(0);
      expect(total).toBe(23);
      expect(page).toBe(1);
      expect(pageSize).toBe(10);
      expect(totalPages).toBe(3);
    });
  });
});
