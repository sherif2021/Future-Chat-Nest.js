import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }


  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<Object> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto): Promise<Object> {
    return this.authService.register(registerDto);
  }

  @Get('check-phone/:phone')
  checkPhone(@Param('phone') phone: string) {
    return this.authService.checkPhone(phone);
  }
}
