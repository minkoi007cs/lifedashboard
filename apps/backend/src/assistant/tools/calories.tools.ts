import { CaloriesService } from '../../calories/calories.service';
import { ToolDefinition } from './tool-registry';

export function buildCaloriesTools(caloriesService: CaloriesService): ToolDefinition[] {
  return [
    // ── READ ─────────────────────────────────────────────────────────────────
    {
      name: 'calories_get_statistics',
      description:
        "Get the current user's calorie and nutrition data: today's intake, macros breakdown, active diet plan, weight trend, and full food entry history.",
      inputSchema: {
        type: 'object' as const,
        properties: {},
        required: [],
      },
      type: 'READ',
      execute: async (_params, userId) => {
        return caloriesService.getStatistics(userId);
      },
    },

    // ── MUTATE ────────────────────────────────────────────────────────────────
    {
      name: 'calories_log_food',
      description:
        'Log a food entry (meal) for the current user. Requires user confirmation before execution.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          name: { type: 'string', description: 'Food name (e.g. "Chicken breast", "Rice")' },
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          mealType: {
            type: 'string',
            enum: ['breakfast', 'lunch', 'dinner', 'snack'],
            description: 'Which meal this belongs to',
          },
          calories: { type: 'number', description: 'Total calories for this entry' },
          protein: { type: 'number', description: 'Protein in grams (use 0 if unknown)' },
          fat: { type: 'number', description: 'Fat in grams (use 0 if unknown)' },
          carbs: { type: 'number', description: 'Carbohydrates in grams (use 0 if unknown)' },
          amount: { type: 'number', description: 'Amount in grams (default 100)' },
        },
        required: ['name', 'date', 'mealType', 'calories', 'protein', 'fat', 'carbs'],
      },
      type: 'MUTATE',
      execute: async (params, userId) => {
        return caloriesService.logFood(
          {
            name: params.name as string,
            date: params.date as string,
            mealType: params.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
            calories: params.calories as number,
            protein: params.protein as number,
            fat: params.fat as number,
            carbs: params.carbs as number,
            amount: (params.amount as number | undefined) ?? 100,
          },
          userId,
        );
      },
      describeAction: (params) =>
        `Log food: ${params.name} (${params.calories} kcal) – ${params.mealType} on ${params.date}`,
    },

    {
      name: 'calories_delete_food',
      description:
        'Delete a food log entry by ID. Requires user confirmation. Get the ID from calories_get_statistics first.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'Food entry ID (UUID)' },
        },
        required: ['id'],
      },
      type: 'MUTATE',
      execute: async (params, userId) => {
        return caloriesService.deleteFood(params.id as string, userId);
      },
      describeAction: (params) => `Delete food entry ID: ${params.id}`,
    },
  ];
}
