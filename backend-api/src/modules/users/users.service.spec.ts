import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { UsersService } from './users.service';
import { User } from './schemas/user.schema';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let userModelMock: any;

  beforeEach(async () => {
    userModelMock = jest.fn().mockImplementation((doc) => ({
      ...doc,
      save: jest.fn().mockResolvedValue({ ...doc, id: 'new-user' }),
    }));
    userModelMock.findOne = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    userModelMock.findById = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: getModelToken(User.name), useValue: userModelMock }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('hasheia a senha, normaliza o e-mail e salva', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');

      const result: any = await service.create({
        name: 'Ana',
        email: '  ANA@Example.com ',
        password: 'segredo123',
        city: 'São Paulo',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('segredo123', 10);
      expect(result.email).toBe('ana@example.com');
      expect(result.passwordHash).toBe('hashed-pw');
      expect(result.profile).toEqual({ city: 'São Paulo' });
    });

    it('lança Conflict quando o e-mail já existe', async () => {
      userModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: 'existing' }),
      });
      await expect(
        service.create({ name: 'Ana', email: 'ana@example.com', password: 'segredo123' }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
