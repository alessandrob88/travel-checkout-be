import { Test, TestingModule } from '@nestjs/testing';
import { TravelService } from './travel.service';
import { Repository } from 'typeorm';
import { Travel } from './entities/travel.entity';
import { TravelValidator } from './travel.validator';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MoodType } from './entities/mood.entity';

const mockTravelRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  manager: {
    connection: {
      createQueryRunner: jest.fn().mockReturnValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn(),
          save: jest.fn(),
        },
      }),
    },
  },
};

const mockTravelValidator = {
  validateSeatUpdate: jest.fn(),
};

describe('TravelService', () => {
  let service: TravelService;
  let repository: jest.Mocked<Repository<Travel>>;
  let validator: jest.Mocked<TravelValidator>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TravelService,
        {
          provide: getRepositoryToken(Travel),
          useValue: mockTravelRepository,
        },
        {
          provide: TravelValidator,
          useValue: mockTravelValidator,
        },
      ],
    }).compile();

    service = module.get<TravelService>(TravelService);
    repository = module.get(getRepositoryToken(Travel));
    validator = module.get(TravelValidator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const travelTestData: Travel = {
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

  describe('getAllTravels', () => {
    it('should return a paginated list of travels', async () => {
      const travels = [travelTestData, { ...travelTestData, id: 'another-id' }];
      const paginationResponse = {
        data: travels,
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      // Mocking `findAndCount` method of the repository because is used on abstract class
      repository.findAndCount = jest.fn().mockResolvedValueOnce([travels, 2]);

      const result = await service.getAllTravels(1, 10);

      expect(result).toEqual(paginationResponse);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        relations: ['moods'],
      });
    });

    it('should return an empty list if no travels are found', async () => {
      // Mocking `findAndCount` method of the repository because is used on abstract class
      repository.findAndCount = jest.fn().mockResolvedValueOnce([[], 0]);

      const result = await service.getAllTravels(1, 10);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        relations: ['moods'],
      });
    });

    it('should handle pagination correctly when there are multiple pages', async () => {
      const travels = [travelTestData, { ...travelTestData, id: 'another-id' }];
      const paginationResponse = {
        data: travels,
        total: 22,
        page: 3,
        pageSize: 10,
        totalPages: 3,
      };

      // Mocking `findAndCount` method of the repository because is used on abstract class
      repository.findAndCount = jest.fn().mockResolvedValueOnce([travels, 22]);

      const result = await service.getAllTravels(3, 10);

      expect(result).toEqual(paginationResponse);
      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 20,
        take: 10,
        relations: ['moods'],
      });
    });
  });

  describe('getTravelById', () => {
    it('should return a travel entity by ID', async () => {
      repository.findOne.mockResolvedValueOnce(travelTestData);

      const result = await service.getTravelById(travelTestData.id);
      expect(result).toEqual(travelTestData);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: travelTestData.id },
        relations: ['moods'],
      });
    });

    it('should return null if travel is not found', async () => {
      repository.findOne.mockResolvedValueOnce(null);

      const result = await service.getTravelById(travelTestData.id);
      expect(result).toBeNull();
    });
  });

  describe('getTravelBySlug', () => {
    it('should return a travel entity by slug', async () => {
      repository.findOne.mockResolvedValueOnce(travelTestData);

      const result = await service.getTravelBySlug(travelTestData.slug);
      expect(result).toEqual(travelTestData);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { slug: travelTestData.slug },
        relations: ['moods'],
      });
    });

    it('should return null if travel is not found by slug', async () => {
      repository.findOne.mockResolvedValueOnce(null);

      const result = await service.getTravelBySlug(travelTestData.slug);
      expect(result).toBeNull();
    });
  });

  describe('increaseAvailableSeats', () => {
    it('should increase available seats number', async () => {
      const queryRunner =
        mockTravelRepository.manager.connection.createQueryRunner();

      queryRunner.manager.findOne.mockResolvedValueOnce(travelTestData);
      queryRunner.manager.save.mockResolvedValueOnce({
        ...travelTestData,
        availableSeats: 15,
      });

      const result = await service.increaseAvailableSeats(travelTestData.id, 5);

      expect(validator.validateSeatUpdate).toHaveBeenCalledWith(
        travelTestData,
        5,
      );

      expect(result.availableSeats).toBe(15);
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Travel, {
        where: { id: travelTestData.id },
      });
      expect(queryRunner.manager.save).toHaveBeenCalledWith(Travel, {
        ...travelTestData,
        availableSeats: 15,
      });
    });

    it('should throw an error if seats increase is invalid', async () => {
      const queryRunner =
        mockTravelRepository.manager.connection.createQueryRunner();

      queryRunner.manager.findOne.mockResolvedValueOnce(travelTestData);
      validator.validateSeatUpdate.mockImplementationOnce(() => {
        throw new Error('Cannot increase available seats beyond total seats');
      });

      await expect(
        service.increaseAvailableSeats(travelTestData.id, 11),
      ).rejects.toThrow('Cannot increase available seats beyond total seats');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw an error if travel was not found', async () => {
      const queryRunner =
        mockTravelRepository.manager.connection.createQueryRunner();
      queryRunner.manager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.increaseAvailableSeats(travelTestData.id, 5),
      ).rejects.toThrow('Travel not found');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('decreaseAvailableSeats', () => {
    it('should decrease available seats number', async () => {
      const queryRunner =
        mockTravelRepository.manager.connection.createQueryRunner();

      queryRunner.manager.findOne.mockResolvedValueOnce(travelTestData);
      queryRunner.manager.save.mockResolvedValueOnce({
        ...travelTestData,
        availableSeats: 5,
      });

      const result = await service.decreaseAvailableSeats(travelTestData.id, 5);
      expect(result.availableSeats).toBe(5);
      expect(queryRunner.manager.findOne).toHaveBeenCalledWith(Travel, {
        where: { id: travelTestData.id },
      });
      expect(validator.validateSeatUpdate).toHaveBeenCalledWith(
        travelTestData,
        -5,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw an error if seats decrease is invalid', async () => {
      const queryRunner =
        mockTravelRepository.manager.connection.createQueryRunner();

      queryRunner.manager.findOne.mockResolvedValueOnce(travelTestData);
      validator.validateSeatUpdate.mockImplementationOnce(() => {
        throw new Error('Not enough available seats');
      });

      await expect(
        service.decreaseAvailableSeats(travelTestData.id, 11),
      ).rejects.toThrow('Not enough available seats');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw an error if travel was not found', async () => {
      const queryRunner =
        mockTravelRepository.manager.connection.createQueryRunner();
      queryRunner.manager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.decreaseAvailableSeats(travelTestData.id, 5),
      ).rejects.toThrow('Travel not found');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });
});
