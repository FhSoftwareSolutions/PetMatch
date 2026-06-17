import { Controller, Get, UseGuards, Req, NotFoundException } from '@nestjs/common';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt.strategy';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /users/me — perfil do usuário autenticado (requer JWT). */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: { user: JwtUser }) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user; // toJSON remove o passwordHash
  }
}
