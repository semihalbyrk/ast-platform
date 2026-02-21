import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto) {
    const payload = await this.authService.validateRefreshToken(dto.refreshToken);
    return this.authService.refresh(dto.refreshToken, payload.sub);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('id') userId: string) {
    await this.authService.logout(userId);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { id: string; email: string; role: string; name: string }) {
    return user;
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminOnly(@CurrentUser() user: { id: string; role: string }) {
    return { message: 'Admin access granted', userId: user.id };
  }

  @Get('finance-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FINANCE, UserRole.ADMIN)
  async financeOnly(@CurrentUser() user: { id: string; role: string }) {
    return { message: 'Finance access granted', userId: user.id };
  }

  @Get('operations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OPERATIONS_MANAGER, UserRole.SCALE_OPERATOR, UserRole.ADMIN)
  async operationsOnly(@CurrentUser() user: { id: string; role: string }) {
    return { message: 'Operations access granted', userId: user.id };
  }
}
