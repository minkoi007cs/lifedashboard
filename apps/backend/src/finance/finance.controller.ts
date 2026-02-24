import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('finance')
@UseGuards(AuthGuard('jwt'))
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Post('daily-entry')
    createDailyEntry(@Request() req, @Body() data: any) {
        return this.financeService.createDailyEntry(data, req.user.userId);
    }

    @Get('pay-period/active')
    getActivePayPeriod(@Request() req) {
        return this.financeService.getActivePayPeriod(req.user.userId);
    }

    @Post('pay-period/start')
    startPayPeriod(@Request() req, @Body('startDate') startDate: string) {
        return this.financeService.startPayPeriod(req.user.userId, startDate);
    }

    @Get('statistics')
    getStatistics(@Request() req) {
        return this.financeService.getStatistics(req.user.userId);
    }
}
