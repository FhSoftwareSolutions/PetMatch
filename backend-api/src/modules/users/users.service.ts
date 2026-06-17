import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { User, UserDocument } from './schemas/user.schema';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  /** Cria um usuário com a senha já hasheada (bcrypt). E-mail é único. */
  async create(data: CreateUserData): Promise<UserDocument> {
    const email = data.email.toLowerCase().trim();
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = new this.userModel({
      name: data.name,
      email,
      passwordHash,
      phone: data.phone,
      profile: data.city ? { city: data.city } : {},
    });
    return user.save();
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }
}
