import {
  Controller,
  Get,
  Req,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuditService, AuditReport } from './audit.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { firebaseUid: string; email: string };
}

@UseGuards(FirebaseAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getAudit(@Req() req: AuthenticatedRequest): Promise<AuditReport> {
    return this.auditService.generateAudit(req.user.firebaseUid);
  }

  @Get('export')
  async exportAudit(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    const { filename, content, contentType } =
      await this.auditService.exportAudit(req.user.firebaseUid);

    res.status(HttpStatus.OK);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }
}
