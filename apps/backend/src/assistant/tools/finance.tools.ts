import { FinanceService } from '../../finance/finance.service';
import { ToolDefinition } from './tool-registry';

export function buildFinanceTools(financeService: FinanceService): ToolDefinition[] {
  return [
    // ── READ ─────────────────────────────────────────────────────────────────
    {
      name: 'finance_get_statistics',
      description:
        'Get the current user\'s finance statistics: total income, total expenses, net profit, and the full list of sales and expenses. Use this before answering any finance question.',
      inputSchema: {
        type: 'object' as const,
        properties: {},
        required: [],
      },
      type: 'READ',
      execute: async (_params, userId) => {
        return financeService.getStatistics(userId);
      },
    },

    // ── MUTATE ────────────────────────────────────────────────────────────────
    {
      name: 'finance_add_expense',
      description:
        'Add a new expense entry for the current user. Requires user confirmation before execution.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          amount: { type: 'number', description: 'Expense amount (positive number)' },
          description: { type: 'string', description: 'What the expense was for' },
          category: {
            type: 'string',
            description:
              'Optional category (e.g. "Food", "Transport", "Work"). Leave blank to auto-detect.',
          },
        },
        required: ['date', 'amount', 'description'],
      },
      type: 'MUTATE',
      execute: async (params, userId) => {
        return financeService.saveExpense(
          {
            date: params.date as string,
            amount: params.amount as number,
            description: params.description as string,
            category: params.category as string | undefined,
          },
          userId,
        );
      },
      describeAction: (params) =>
        `Add expense: ${params.description} – $${Number(params.amount).toFixed(2)} on ${params.date}`,
    },

    {
      name: 'finance_add_income',
      description:
        'Add an income entry (service sales + cash tips) for a date. Requires user confirmation.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          serviceSales: { type: 'number', description: 'Service/check income amount' },
          cashTips: { type: 'number', description: 'Cash tips amount (use 0 if none)' },
          description: { type: 'string', description: 'Optional note for this entry' },
        },
        required: ['date', 'serviceSales', 'cashTips'],
      },
      type: 'MUTATE',
      execute: async (params, userId) => {
        return financeService.saveIncome(
          {
            date: params.date as string,
            serviceSales: params.serviceSales as number,
            cashTips: params.cashTips as number,
            description: params.description as string | undefined,
          },
          userId,
        );
      },
      describeAction: (params) =>
        `Add income: $${Number(params.serviceSales).toFixed(2)} service + $${Number(params.cashTips).toFixed(2)} cash on ${params.date}`,
    },

    {
      name: 'finance_delete_expense',
      description:
        'Delete an expense entry by ID. Requires user confirmation. Get the ID from finance_get_statistics first.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'Expense record ID (UUID)' },
        },
        required: ['id'],
      },
      type: 'MUTATE',
      execute: async (params, userId) => {
        return financeService.deleteExpense(params.id as string, userId);
      },
      describeAction: (params) => `Delete expense ID: ${params.id}`,
    },
  ];
}
