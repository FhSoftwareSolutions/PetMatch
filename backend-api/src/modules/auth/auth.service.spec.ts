import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersServiceMock: any;
  let jwtServiceMock: any;

  const user = {
    id: '0000000000000000000000a1',
    email: 'ana@example.com',
    passwordHash: 'hashed',
    toJSON: () => ({ id: '0000000000000000000000a1', email: 'ana@example.com', name: 'Ana' }),
  };

  beforeEach(async () => {
    usersServiceMock = {
      create: jest.fn().mockResolvedValue(user),
      findByEmail: jest.fn().mockResolvedValue(user),
    };
    jwtServiceMock = { sign: jest.fn().mockReturnValue('jwt-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('cria o usuário e devolve token + user (sem hash)', async () => {
      const result = await service.register({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'segredo123',
      });
      expect(usersServiceMock.create).toHaveBeenCalled();
      expect(jwtServiceMock.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
      });
      expect(result.accessToken).toBe('jwt-token');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('login', () => {
    it('devolve token quando a senha confere', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.login({ email: 'ana@example.com', password: 'segredo123' });
      expect(result.accessToken).toBe('jwt-token');
    });

    it('lança Unauthorized quando a senha não confere', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        service.login({ email: 'ana@example.com', password: 'errada' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lança Unauthorized quando o e-mail não existe', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'naoexiste@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
