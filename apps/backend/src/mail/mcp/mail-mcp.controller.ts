import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../../auth/types/auth-user';
import { MailMcpService } from './mail-mcp.service';

@Controller('mail/mcp')
@UseGuards(JwtAuthGuard)
export class MailMcpController {
  constructor(private readonly mcpService: MailMcpService) {}

  @Get('manifest')
  getManifest() {
    return this.mcpService.getManifest();
  }

  @Get('status')
  getStatus(@GetUser() user: AuthenticatedUser) {
    return this.mcpService.getStatus(user.userId);
  }

  @Post('call')
  callTool(
    @GetUser() user: AuthenticatedUser,
    @Body() body: { tool: string; arguments?: Record<string, any> },
  ) {
    return this.mcpService.handleToolCall(user.userId, body.tool, body.arguments || {});
  }
}
