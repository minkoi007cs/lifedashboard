import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinanceSale, FinanceExpense } from './finance.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FinanceSale)
    private saleRepository: Repository<FinanceSale>,
    @InjectRepository(FinanceExpense)
    private expenseRepository: Repository<FinanceExpense>,
  ) {}

  async createDailyEntry(
    data: {
      date: string;
      serviceSales: number;
      cashTips: number;
      description?: string;
      originalDate?: string;
      expenses: { description: string; amount: number; category?: string }[];
    },
    userId: string,
  ) {
    // 0. Delete old records if date is being edited
    if (data.originalDate && data.originalDate !== data.date) {
      await this.saleRepository.delete({ date: data.originalDate, userId });
      await this.expenseRepository.delete({ date: data.originalDate, userId });
    }

    // serviceSales is now check income before tax; cashTips is cash income.
    // Keep legacy column names to avoid a breaking migration.
    const checkIncome = data.serviceSales;
    const cashIncome = data.cashTips;
    const taxAmount = checkIncome * 0.15;
    const netCheck = checkIncome - taxAmount;
    const grossIncome = checkIncome + cashIncome;

    // 2. Check if sale already exists for this date and user
    let sale = await this.saleRepository.findOne({
      where: { date: data.date, userId },
    });

    if (sale) {
      sale.serviceSales = data.serviceSales;
      sale.cashTips = data.cashTips;
      sale.ccTips = 0;
      sale.description = data.description || '';
      sale.commissionBase = grossIncome;
      sale.cashCommission = cashIncome;
      sale.checkCommission = checkIncome;
      sale.taxAmount = taxAmount;
      sale.netCheck = netCheck;
    } else {
      sale = this.saleRepository.create({
        serviceSales: data.serviceSales,
        cashTips: data.cashTips,
        ccTips: 0,
        date: data.date,
        description: data.description || '',
        commissionBase: grossIncome,
        cashCommission: cashIncome,
        checkCommission: checkIncome,
        taxAmount,
        netCheck,
        userId,
      });
    }
    await this.saleRepository.save(sale);

    // 3. Clear existing expenses for this date and user to prevent duplicates
    await this.expenseRepository.delete({ date: data.date, userId });

    // 4. Save new Expenses
    const expenses = data.expenses.map((e) =>
      this.expenseRepository.create({
        ...e,
        date: data.date,
        category: e.category || this.suggestCategory(e.description),
        userId,
      }),
    );
    if (expenses.length > 0) {
      await this.expenseRepository.save(expenses);
    }

    return { sale, expenses };
  }

  private normalizeSale(sale: FinanceSale) {
    const checkIncome = sale.serviceSales || 0;
    const cashIncome = sale.cashTips || 0;
    const taxAmount = checkIncome * 0.15;

    return {
      ...sale,
      ccTips: 0,
      commissionBase: checkIncome + cashIncome,
      cashCommission: cashIncome,
      checkCommission: checkIncome,
      taxAmount,
      netCheck: checkIncome - taxAmount,
    };
  }

  private suggestCategory(description: string): string {
    const desc = description.toLowerCase();
    if (desc.match(/gas|maintenance|rent|utilities|phone|car/))
      return 'Living / Transport';
    if (desc.match(/tuition|books|course|school|exam/)) return 'Study / School';
    if (desc.match(/supplies|tools|salon|education/)) return 'Work';
    if (desc.match(/food|shopping|entertainment|health/)) return 'Personal';
    if (desc.match(/tax|savings|investment/)) return 'Financial';
    return 'Other';
  }

  async getStatistics(userId: string) {
    const sales = await this.saleRepository.find({
      where: { userId },
      order: { date: 'ASC' },
    });
    const expenses = await this.expenseRepository.find({
      where: { userId },
      order: { date: 'ASC' },
    });

    const normalizedSales = sales.map((sale) => this.normalizeSale(sale));
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalTaxAmount = normalizedSales.reduce(
      (sum, s) => sum + s.taxAmount,
      0,
    );
    const totalCheckIncome = normalizedSales.reduce(
      (sum, s) => sum + s.serviceSales,
      0,
    );
    const totalCashIncome = normalizedSales.reduce(
      (sum, s) => sum + s.cashTips,
      0,
    );
    const totalNetIncome = normalizedSales.reduce(
      (sum, s) => sum + s.serviceSales - s.taxAmount + s.cashTips,
      0,
    );

    return {
      totalExpenses,
      totalRealProfit: totalNetIncome - totalExpenses,
      totalCheckIncome,
      totalCashIncome,
      totalGrossIncome: totalCheckIncome + totalCashIncome,
      totalTaxAmount,
      totalNetIncome,
      sales: normalizedSales,
      expenses,
    };
  }

  async deleteDailyEntry(date: string, userId: string) {
    // 1. Delete Sale
    await this.saleRepository.delete({ date, userId });

    // 2. Delete Expenses
    await this.expenseRepository.delete({ date, userId });

    return { success: true };
  }
}
