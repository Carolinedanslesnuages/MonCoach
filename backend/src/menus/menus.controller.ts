import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { MenusService } from './menus.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { GenerateMenuDto } from './dto/generate-menu.dto';

interface AuthenticatedRequest extends Request {
  user: { firebaseUid: string; email: string };
}

@UseGuards(FirebaseAuthGuard)
@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Post('generate')
  async generate(
    @Req() req: AuthenticatedRequest,
    @Body() dto: GenerateMenuDto,
  ) {
    return this.menusService.generateMenu(req.user.firebaseUid, dto);
  }
}
