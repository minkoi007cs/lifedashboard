import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { FinanceSale, FinanceExpense, FinanceShare } from './finance.entity';
import { FinanceWallet, WalletType } from './entities/finance-wallet.entity';
import { FinanceCategory, CategoryType } from './entities/finance-category.entity';
import { FinanceTransaction, TransactionType } from './entities/finance-transaction.entity';
import { FinanceBudget } from './entities/finance-budget.entity';
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
    @InjectRepository(FinanceWallet)
    private walletRepository: Repository<FinanceWallet>,
    @InjectRepository(FinanceCategory)
    private categoryRepository: Repository<FinanceCategory>,
    @InjectRepository(FinanceTransaction)
    private transactionRepository: Repository<FinanceTransaction>,
    @InjectRepository(FinanceBudget)
    private budgetRepository: Repository<FinanceBudget>,
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
      throw new BadRequestException(
        'You cannot share your finance with yourself',
      );
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

  // ── Granular transaction operations ──────────────────────────────────────

  async saveExpense(
    data: {
      id?: string;
      date: string;
      amount: number;
      description: string;
      category?: string;
      receiptImage?: string;
    },
    userId: string,
    targetUserId?: string,
  ) {
    if (targetUserId) {
      await this.checkShareAccess(userId, targetUserId, 'edit');
    }
    const effectiveUserId = targetUserId ?? userId;

    let expense: FinanceExpense;

    if (data.id) {
      const existing = await this.expenseRepository.findOne({
        where: { id: data.id, userId: effectiveUserId },
      });
      if (!existing) {
        throw new NotFoundException('Expense not found');
      }
      expense = existing;
      expense.date = data.date;
      expense.amount = data.amount;
      expense.description = data.description;
      expense.category =
        data.category || this.suggestCategory(data.description);
      expense.receiptImage = data.receiptImage || undefined;
    } else {
      expense = this.expenseRepository.create({
        date: data.date,
        amount: data.amount,
        description: data.description,
        category: data.category || this.suggestCategory(data.description),
        receiptImage: data.receiptImage || undefined,
        userId: effectiveUserId,
      });
    }

    return this.expenseRepository.save(expense);
  }

  async deleteExpense(id: string, userId: string, targetUserId?: string) {
    if (targetUserId) {
      await this.checkShareAccess(userId, targetUserId, 'edit');
    }
    const effectiveUserId = targetUserId ?? userId;

    const expense = await this.expenseRepository.findOne({
      where: { id, userId: effectiveUserId },
    });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    await this.expenseRepository.remove(expense);
    return { success: true };
  }

  async saveIncome(
    data: {
      id?: string;
      date: string;
      serviceSales: number;
      cashTips: number;
      description?: string;
      receiptImage?: string;
    },
    userId: string,
    targetUserId?: string,
  ) {
    if (targetUserId) {
      await this.checkShareAccess(userId, targetUserId, 'edit');
    }
    const effectiveUserId = targetUserId ?? userId;

    const checkIncome = data.serviceSales;
    const cashIncome = data.cashTips;
    const taxAmount = checkIncome * 0.15;
    const netCheck = checkIncome - taxAmount;
    const grossIncome = checkIncome + cashIncome;

    let sale: FinanceSale;

    if (data.id) {
      const existing = await this.saleRepository.findOne({
        where: { id: data.id, userId: effectiveUserId },
      });
      if (!existing) {
        throw new NotFoundException('Income not found');
      }
      sale = existing;
      sale.date = data.date;
      sale.serviceSales = data.serviceSales;
      sale.cashTips = data.cashTips;
      sale.ccTips = 0;
      sale.description = data.description || '';
      sale.receiptImage = data.receiptImage || undefined;
      sale.commissionBase = grossIncome;
      sale.cashCommission = cashIncome;
      sale.checkCommission = checkIncome;
      sale.taxAmount = taxAmount;
      sale.netCheck = netCheck;
    } else {
      sale = this.saleRepository.create({
        date: data.date,
        serviceSales: data.serviceSales,
        cashTips: data.cashTips,
        ccTips: 0,
        description: data.description || '',
        receiptImage: data.receiptImage || undefined,
        commissionBase: grossIncome,
        cashCommission: cashIncome,
        checkCommission: checkIncome,
        taxAmount,
        netCheck,
        userId: effectiveUserId,
      });
    }

    return this.saleRepository.save(sale);
  }

  async deleteIncome(id: string, userId: string, targetUserId?: string) {
    if (targetUserId) {
      await this.checkShareAccess(userId, targetUserId, 'edit');
    }
    const effectiveUserId = targetUserId ?? userId;

    const sale = await this.saleRepository.findOne({
      where: { id, userId: effectiveUserId },
    });
    if (!sale) {
      throw new NotFoundException('Income not found');
    }

    await this.saleRepository.remove(sale);
    return { success: true };
  }

  // ── Standard Personal & Family Finance Methods ────────────────────────────

  async seedDefaultCategories(userId: string): Promise<FinanceCategory[]> {
    const existing = await this.categoryRepository.find({
      where: [{ userId }, { isSystem: true }],
    });
    if (existing.length > 0) {
      return existing;
    }

    const defaultCategories: Partial<FinanceCategory>[] = [
      { name: 'Lương & Thu nhập', type: 'income', icon: 'Briefcase', color: '#10b981', isSystem: true },
      { name: 'Thưởng & Bonus', type: 'income', icon: 'Award', color: '#06b6d4', isSystem: true },
      { name: 'Đầu tư & Tiết kiệm', type: 'income', icon: 'TrendingUp', color: '#3b82f6', isSystem: true },
      { name: 'Thu nhập khác', type: 'income', icon: 'PlusCircle', color: '#8b5cf6', isSystem: true },
      { name: 'Ăn uống & Cà phê', type: 'expense', icon: 'Utensils', color: '#f97316', isSystem: true },
      { name: 'Tiền chợ & Thực phẩm', type: 'expense', icon: 'ShoppingBag', color: '#eab308', isSystem: true },
      { name: 'Nhà cửa & Điện nước', type: 'expense', icon: 'Home', color: '#ef4444', isSystem: true },
      { name: 'Đi lại & Xăng xe', type: 'expense', icon: 'Car', color: '#6366f1', isSystem: true },
      { name: 'Mua sắm & Đồ gia dụng', type: 'expense', icon: 'ShoppingCart', color: '#ec4899', isSystem: true },
      { name: 'Giải trí & Du lịch', type: 'expense', icon: 'Film', color: '#a855f7', isSystem: true },
      { name: 'Y tế & Sức khỏe', type: 'expense', icon: 'Heart', color: '#14b8a6', isSystem: true },
      { name: 'Giáo dục & Học tập', type: 'expense', icon: 'BookOpen', color: '#0284c7', isSystem: true },
    ];

    const created = this.categoryRepository.create(defaultCategories);
    return this.categoryRepository.save(created);
  }

  async getCategories(userId: string): Promise<FinanceCategory[]> {
    let categories = await this.categoryRepository.find({
      where: [{ userId }, { isSystem: true }],
      order: { name: 'ASC' },
    });
    if (categories.length === 0) {
      categories = await this.seedDefaultCategories(userId);
    }
    return categories;
  }

  async createCategory(
    data: { name: string; type: CategoryType; icon?: string; color?: string },
    userId: string,
  ): Promise<FinanceCategory> {
    const category = this.categoryRepository.create({
      ...data,
      userId,
      isSystem: false,
    });
    return this.categoryRepository.save(category);
  }

  async getWallets(userId: string): Promise<FinanceWallet[]> {
    return this.walletRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
  }

  async createWallet(
    data: { name: string; type?: WalletType; balance?: number; currency?: string; isFamilyShared?: boolean },
    userId: string,
  ): Promise<FinanceWallet> {
    const wallet = this.walletRepository.create({
      name: data.name,
      type: data.type || 'cash',
      balance: data.balance || 0,
      currency: data.currency || 'VND',
      isFamilyShared: !!data.isFamilyShared,
      userId,
    });
    return this.walletRepository.save(wallet);
  }

  async updateWallet(
    id: string,
    data: Partial<FinanceWallet>,
    userId: string,
  ): Promise<FinanceWallet> {
    const wallet = await this.walletRepository.findOne({ where: { id, userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    Object.assign(wallet, data);
    return this.walletRepository.save(wallet);
  }

  async deleteWallet(id: string, userId: string): Promise<{ success: boolean }> {
    const wallet = await this.walletRepository.findOne({ where: { id, userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    await this.walletRepository.remove(wallet);
    return { success: true };
  }

  async createTransaction(
    data: {
      amount: number;
      type: TransactionType;
      date: string;
      note?: string;
      receiptImage?: string;
      isFamilyShared?: boolean;
      walletId?: string;
      categoryId?: string;
      paidByUserId?: string;
    },
    userId: string,
  ): Promise<FinanceTransaction> {
    const transaction = this.transactionRepository.create({
      ...data,
      userId,
      paidByUserId: data.paidByUserId || userId,
    });

    const saved = await this.transactionRepository.save(transaction);

    // Update wallet balance if a wallet is associated
    if (data.walletId) {
      const wallet = await this.walletRepository.findOne({ where: { id: data.walletId } });
      if (wallet) {
        if (data.type === 'income') {
          wallet.balance += Number(data.amount);
        } else if (data.type === 'expense') {
          wallet.balance -= Number(data.amount);
        }
        await this.walletRepository.save(wallet);
      }
    }

    return saved;
  }

  async getTransactions(
    userId: string,
    filter?: {
      startDate?: string;
      endDate?: string;
      walletId?: string;
      categoryId?: string;
      isFamilyShared?: boolean;
    },
  ): Promise<FinanceTransaction[]> {
    const query = this.transactionRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.wallet', 'wallet')
      .leftJoinAndSelect('tx.category', 'category')
      .leftJoinAndSelect('tx.paidByUser', 'paidByUser')
      .where('tx.userId = :userId', { userId });

    if (filter?.startDate && filter?.endDate) {
      query.andWhere('tx.date BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    }

    if (filter?.walletId) {
      query.andWhere('tx.walletId = :walletId', { walletId: filter.walletId });
    }

    if (filter?.categoryId) {
      query.andWhere('tx.categoryId = :categoryId', { categoryId: filter.categoryId });
    }

    if (filter?.isFamilyShared !== undefined) {
      query.andWhere('tx.isFamilyShared = :isFamilyShared', { isFamilyShared: filter.isFamilyShared });
    }

    return query.orderBy('tx.date', 'DESC').addOrderBy('tx.createdAt', 'DESC').take(100).getMany();
  }

  async deleteTransaction(id: string, userId: string): Promise<{ success: boolean }> {
    const tx = await this.transactionRepository.findOne({ where: { id, userId } });
    if (!tx) throw new NotFoundException('Transaction not found');

    // Revert wallet balance if applicable
    if (tx.walletId) {
      const wallet = await this.walletRepository.findOne({ where: { id: tx.walletId } });
      if (wallet) {
        if (tx.type === 'income') {
          wallet.balance -= Number(tx.amount);
        } else if (tx.type === 'expense') {
          wallet.balance += Number(tx.amount);
        }
        await this.walletRepository.save(wallet);
      }
    }

    await this.transactionRepository.remove(tx);
    return { success: true };
  }

  async createBudget(
    data: { categoryId: string; month: string; limitAmount: number; notifyThreshold?: number },
    userId: string,
  ): Promise<FinanceBudget> {
    let budget = await this.budgetRepository.findOne({
      where: { userId, categoryId: data.categoryId, month: data.month },
    });

    if (budget) {
      budget.limitAmount = data.limitAmount;
      if (data.notifyThreshold) budget.notifyThreshold = data.notifyThreshold;
    } else {
      budget = this.budgetRepository.create({
        ...data,
        userId,
        notifyThreshold: data.notifyThreshold || 0.8,
      });
    }

    return this.budgetRepository.save(budget);
  }

  async getBudgets(userId: string, month: string) {
    const budgets = await this.budgetRepository.find({
      where: { userId, month },
      relations: ['category'],
    });

    // Compute spent amount for each budget in this month
    const startOfMonth = `${month}-01`;
    const endOfMonth = `${month}-31`;

    const expenses = await this.transactionRepository.find({
      where: {
        userId,
        type: 'expense',
        date: Between(startOfMonth, endOfMonth),
      },
    });

    return budgets.map((b) => {
      const spent = expenses
        .filter((e) => e.categoryId === b.categoryId)
        .reduce((sum, e) => sum + Number(e.amount), 0);
      return {
        ...b,
        spentAmount: spent,
      };
    });
  }

  async getOverview(userId: string, monthStr?: string) {
    const currentMonth = monthStr || new Date().toISOString().slice(0, 7); // YYYY-MM
    const startOfMonth = `${currentMonth}-01`;
    const endOfMonth = `${currentMonth}-31`;

    // Ensure wallets exist (seed a default cash wallet if none)
    let wallets = await this.getWallets(userId);
    if (wallets.length === 0) {
      const defaultWallet = await this.createWallet({ name: 'Ví tiền mặt', type: 'cash', balance: 0 }, userId);
      wallets = [defaultWallet];
    }

    const totalNetWorth = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);

    const monthTransactions = await this.transactionRepository.find({
      where: {
        userId,
        date: Between(startOfMonth, endOfMonth),
      },
      relations: ['category', 'wallet'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });

    let monthlyIncome = 0;
    let monthlyExpense = 0;
    const categoryMap = new Map<string, { name: string; color: string; amount: number }>();

    for (const tx of monthTransactions) {
      const amt = Number(tx.amount || 0);
      if (tx.type === 'income') {
        monthlyIncome += amt;
      } else if (tx.type === 'expense') {
        monthlyExpense += amt;
        const catName = tx.category?.name || 'Khác';
        const catColor = tx.category?.color || '#94a3b8';
        const current = categoryMap.get(catName) || { name: catName, color: catColor, amount: 0 };
        current.amount += amt;
        categoryMap.set(catName, current);
      }
    }

    const categoryBreakdown = Array.from(categoryMap.values()).map((c) => ({
      categoryName: c.name,
      color: c.color,
      amount: c.amount,
      percent: monthlyExpense > 0 ? Math.round((c.amount / monthlyExpense) * 100) : 0,
    }));

    const budgets = await this.getBudgets(userId, currentMonth);

    const recentTransactions = await this.transactionRepository.find({
      where: { userId },
      relations: ['category', 'wallet'],
      order: { date: 'DESC', createdAt: 'DESC' },
      take: 20,
    });

    return {
      totalNetWorth,
      monthlyIncome,
      monthlyExpense,
      monthlyCashFlow: monthlyIncome - monthlyExpense,
      wallets,
      recentTransactions,
      budgets,
      categoryBreakdown,
    };
  }
}
