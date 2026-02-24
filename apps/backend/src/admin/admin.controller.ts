import { Controller, Get, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {

    @Get('stats')
    getAdminStats(@Request() req) {
        if (req.user.role !== 'admin') {
            throw new ForbiddenException('Admin access required');
        }
        // Return mock stats for MVP
        return {
            totalUsers: 10,
            activeSessions: 5,
            systemHealth: 'Healthy'
        };
    }
}
