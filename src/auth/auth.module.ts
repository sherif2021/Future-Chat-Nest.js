import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './common/constants';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [JwtModule.register({
    secret: jwtConstants.secret,
    signOptions: { expiresIn: '365d' },
  }),
  MongooseModule.forFeature([
    { name: User.name, schema: UserSchema }
  ]),
  ]
})
export class AuthModule { }
