import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './schemas/user.schema';

/**
 * Gerencia donos de pets: cadastro, autenticação e perfil.
 * Controllers, services e schemas serão adicionados aqui.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [],
  providers: [],
  exports: [MongooseModule],
})
export class UsersModule {}
