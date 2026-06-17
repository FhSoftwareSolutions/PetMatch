import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /** Cria a conta e já devolve o token + o usuário (sem o hash da senha). */
  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return this.buildSession(user);
  }

  /** Valida e-mail + senha e devolve o token. */
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return this.buildSession(user);
  }

  private buildSession(user: UserDocument) {
    const payload = { sub: user.id as string, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: user.toJSON(),
    };
  }
}
