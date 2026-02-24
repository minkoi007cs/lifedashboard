import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FinanceSale, FinanceExpense, PayPeriod } from './finance.entity';

@Injectable()
export class FinanceService {
    constructor(
        @InjectRepository(FinanceSale)
        private saleRepository: Repository<FinanceSale>,
        @InjectRepository(FinanceExpense)
        private expenseRepository: Repository<FinanceExpense>,
        @InjectRepository(PayPeriod)
        private payPeriodRepository: Repository<PayPeriod>,
    ) { }

    async createDailyEntry(data: {
        date: string;
        serviceSales: number;
        cashTips: number;
        ccTips: number;
        expenses: { description: string; amount: number; category?: string }[];
    }, userId: string) {
        // 1. Calculate Commission
        const commissionBase = (data.serviceSales * 0.6) + data.ccTips;
        const cashCommission = commissionBase * 0.4;
        const checkCommission = commissionBase * 0.6;
        const taxAmount = checkCommission * 0.15;
        const netCheck = checkCommission - taxAmount;

        // 2. Save Sale
        const sale = this.saleRepository.create({
            ...data,
            commissionBase,
            cashCommission,
            checkCommission,
            taxAmount,
            netCheck,
            userId,
        });
        await this.saleRepository.save(sale);

        // 3. Save Expenses
        const expenses = data.expenses.map(e => this.expenseRepository.create({
            ...e,
            date: data.date,
            category: e.category || this.suggestCategory(e.description),
            userId,
        }));
        await this.expenseRepository.save(expenses);

        // 4. Update Active Pay Period if exists
        const activePeriod = await this.getActivePayPeriod(userId);
        if (activePeriod) {
            await this.updatePayPeriodTotals(activePeriod.id, userId);
        }

        return { sale, expenses };
    }

    private suggestCategory(description: string): string {
        const desc = description.toLowerCase();
        if (desc.match(/gas|maintenance|rent|utilities|phone|car/)) return 'Living / Transport';
        if (desc.match(/tuition|books|course|school|exam/)) return 'Study / School';
        if (desc.match(/supplies|tools|salon|education/)) return 'Work';
        if (desc.match(/food|shopping|entertainment|health/)) return 'Personal';
        if (desc.match(/tax|savings|investment/)) return 'Financial';
        return 'Other';
    }

    async getActivePayPeriod(userId: string): Promise<PayPeriod | null> {
        return this.payPeriodRepository.findOne({
            where: { userId, isClosed: false },
            order: { startDate: 'DESC' },
        });
    }

    async startPayPeriod(userId: string, startDate: string): Promise<PayPeriod> {
        // Close previous period if any
        const active = await this.getActivePayPeriod(userId);
        if (active) {
            active.isClosed = true;
            await this.payPeriodRepository.save(active);
        }

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 13); // 14 days total

        const period = this.payPeriodRepository.create({
            userId,
            startDate,
            endDate: endDate.toISOString().split('T')[0],
        });
        const saved = await this.payPeriodRepository.save(period);
        await this.updatePayPeriodTotals(saved.id, userId);
        return saved;
    }

    async updatePayPeriodTotals(periodId: string, userId: string): Promise<void> {
        const period = await this.payPeriodRepository.findOne({ where: { id: periodId, userId } });
        if (!period) return;

        const sales = await this.saleRepository.find({
            where: { userId, date: Between(period.startDate, period.endDate) },
        });

        const expenses = await this.expenseRepository.find({
            where: { userId, date: Between(period.startDate, period.endDate) },
        });

        period.grossEarnings = sales.reduce((sum, s) => sum + s.commissionBase + s.cashTips, 0);
        period.taxesPaid = sales.reduce((sum, s) => sum + s.taxAmount, 0);
        period.netPayout = sales.reduce((sum, s) => sum + (s.cashCommission + s.netCheck + s.cashTips), 0);
        period.totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        period.realProfit = period.netPayout - period.totalExpenses;

        await this.payPeriodRepository.save(period);
    }

    async getStatistics(userId: string) {
        const sales = await this.saleRepository.find({ where: { userId }, order: { date: 'ASC' } });
        const expenses = await this.expenseRepository.find({ where: { userId }, order: { date: 'ASC' } });

        const totalProfitSinceDay1 = sales.reduce((sum, s) => sum + (s.cashCommission + s.netCheck + s.cashTips), 0) -
            expenses.reduce((sum, e) => sum + e.amount, 0);

        return {
            totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
            totalRealProfit: totalProfitSinceDay1,
            sales,
            expenses,
        };
    }
}
