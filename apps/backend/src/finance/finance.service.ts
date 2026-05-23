import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FinanceSale, FinanceExpense, FinanceShare } from './finance.entity';
import { User } from '../users/user.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FinanceSale)
    private saleRepository: Repository<FinanceSale>,
    @InjectRepository(FinanceExpense)
    private expenseRepository: Repository<FinanceExpense>,
    @InjectRepository(FinanceShare)
    private shareRepository: Repository<FinanceShare>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ── Share access guard ───────────────────────────────────────────────────
  private async checkShareAccess(
    requestingUserId: string,
    targetUserId: string,
    requiredPermission: 'view' | 'edit',
  ): Promise<void> {
    if (requestingUserId === targetUserId) return;

    const share = await this.shareRepository.findOne({
      where: {
        ownerId: targetUserId,
        sharedWithId: requestingUserId,
        status: 'accepted',
      },
    });

    if (!share) {
      throw new ForbiddenException(
        "You do not have access to this user's finance data",
      );
    }
    if (requiredPermission === 'edit' && share.permission !== 'edit') {
      throw new ForbiddenException(
        "You only have view access to this user's finance data",
      );
    }
  }

  // ── Finance share management ─────────────────────────────────────────────
  async inviteUser(
    ownerId: string,
    ownerEmail: string,
    targetEmail: string,
    permission: 'view' | 'edit',
  ) {
    if (targetEmail.toLowerCase() === ownerEmail.toLowerCase()) {
      throw new BadRequestException('You cannot share your finance with yourself');
    }

    const targetUser = await this.userRepository.findOne({
      where: { email: targetEmail },
    });
    if (!targetUser) {
      throw new NotFoundException('No user found with that email address');
    }

    const existing = await this.shareRepository.findOne({
      where: {
        ownerId,
        sharedWithId: targetUser.id,
        status: In(['pending', 'accepted']),
      },
    });

    if (existing) {
      existing.permission = permission;
      return this.shareRepository.save(existing);
    }

    const share = this.shareRepository.create({
      ownerId,
      sharedWithEmail: targetEmail,
      sharedWithId: targetUser.id,
      permission,
      status: 'pending',
    });
    return this.shareRepository.save(share);
  }

  async getSentShares(ownerId: string) {
    return this.shareRepository.find({
      where: { ownerId },
      relations: ['sharedWith'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReceivedInvites(userId: string) {
    return this.shareRepository.find({
      where: { sharedWithId: userId },
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async acceptInvite(shareId: string, userId: string) {
    const share = await this.shareRepository.findOne({
      where: { id: shareId, sharedWithId: userId, status: 'pending' },
    });
    if (!share) throw new NotFoundException('Invite not found');
    share.status = 'accepted';
    return this.shareRepository.save(share);
  }

  async rejectInvite(shareId: string, userId: string) {
    const share = await this.shareRepository.findOne({
      where: { id: shareId, sharedWithId: userId, status: 'pending' },
    });
    if (!share) throw new NotFoundException('Invite not found');
    share.status = 'rejected';
    return this.shareRepository.save(share);
  }

  async revokeShare(shareId: string, requestingUserId: string) {
    const share = await this.shareRepository.findOne({
      where: { id: shareId },
    });
    if (!share) throw new NotFoundException('Share not found');
    if (
      share.ownerId !== requestingUserId &&
      share.sharedWithId !== requestingUserId
    ) {
      throw new ForbiddenException('Cannot remove this share');
    }
    await this.shareRepository.remove(share);
    return { success: true };
  }

  // ── Finance data operations ──────────────────────────────────────────────
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
    targetUserId?: string,
  ) {
    if (targetUserId) {
      await this.checkShareAccess(userId, targetUserId, 'edit');
    }
    const effectiveUserId = targetUserId ?? userId;

    if (data.originalDate && data.originalDate !== data.date) {
      await this.saleRepository.delete({
        date: data.originalDate,
        userId: effectiveUserId,
      });
      await this.expenseRepository.delete({
        date: data.originalDate,
        userId: effectiveUserId,
      });
    }

    const checkIncome = data.serviceSales;
    const cashIncome = data.cashTips;
    const taxAmount = checkIncome * 0.15;
    const netCheck = checkIncome - taxAmount;
    const grossIncome = checkIncome + cashIncome;

    let sale = await this.saleRepository.findOne({
      where: { date: data.date, userId: effectiveUserId },
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
        userId: effectiveUserId,
      });
    }
    await this.saleRepository.save(sale);

    await this.expenseRepository.delete({
      date: data.date,
      userId: effectiveUserId,
    });

    const expenses = data.expenses.map((e) =>
      this.expenseRepository.create({
        ...e,
        date: data.date,
        category: e.category || this.suggestCategory(e.description),
        userId: effectiveUserId,
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

  async getStatistics(userId: string, targetUserId?: string) {
    if (targetUserId) {
      await this.checkShareAccess(userId, targetUserId, 'view');
    }
    const effectiveUserId = targetUserId ?? userId;

    const sales = await this.saleRepository.find({
      where: { userId: effectiveUserId },
      order: { date: 'ASC' },
    });
    const expenses = await this.expenseRepository.find({
      where: { userId: effectiveUserId },
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

  async deleteDailyEntry(date: string, userId: string, targetUserId?: string) {
    if (targetUserId) {
      await this.checkShareAccess(userId, targetUserId, 'edit');
    }
    const effectiveUserId = targetUserId ?? userId;

    await this.saleRepository.delete({ date, userId: effectiveUserId });
    await this.expenseRepository.delete({ date, userId: effectiveUserId });

    return { success: true };
  }
}
