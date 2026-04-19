import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

interface AuthenticatedRequest extends Request {
  user: { firebaseUid: string; email: string };
}

@UseGuards(FirebaseAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Returns the authenticated user record, creating it on first call.
   * The mobile app should call this after login to ensure the user exists.
   */
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findOrCreateUser(
      req.user.firebaseUid,
      req.user.email,
    );
  }

  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.usersService.getProfile(req.user.firebaseUid);
  }

  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  async createProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProfileDto,
  ) {
    // Ensure the user row exists before creating profile
    await this.usersService.findOrCreateUser(
      req.user.firebaseUid,
      req.user.email,
    );
    return this.usersService.createProfile(req.user.firebaseUid, dto);
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.firebaseUid, dto);
  }
}
