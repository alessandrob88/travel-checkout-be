import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { ConflictException } from '@nestjs/common';

const mockUserRepository = {
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      const mockUser = {
        id: '123abc-def00-123abc-def00',
        email: 'test@example.com',
      } as User;

      repository.findOneBy.mockResolvedValueOnce(null);
      repository.create.mockReturnValueOnce(mockUser);
      repository.save.mockResolvedValueOnce(mockUser);

      const result = await service.createUser(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: mockUser.email,
      });
      expect(repository.create).toHaveBeenCalledWith({ email: mockUser.email });
      expect(repository.save).toHaveBeenCalledWith(mockUser);
    });

    it('should throw a ConflictException if the email already exists', async () => {
      const existingUser = {
        id: '123abc-def00-123abc-def00',
        email: 'existing@example.com',
      } as User;

      repository.findOneBy.mockResolvedValue(existingUser);

      await expect(service.createUser(existingUser.email)).rejects.toThrow(
        ConflictException,
      );
      expect(repository.findOneBy).toHaveBeenCalledWith({
        email: existingUser.email,
      });
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });
});
