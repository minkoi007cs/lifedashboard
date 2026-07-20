import { HabitsService } from '../../habits/habits.service';
import { ToolDefinition } from './tool-registry';

export function buildHabitsTools(habitsService: HabitsService): ToolDefinition[] {
  return [
    // ── READ ─────────────────────────────────────────────────────────────────
    {
      name: 'habits_get_overview',
      description:
        "Get the current user's habits and statistics: all active habits, current streaks, weekly completion summary, and monthly heatmap. Use before answering any question about habits.",
      inputSchema: {
        type: 'object' as const,
        properties: {},
        required: [],
      },
      type: 'READ',
      execute: async (_params, userId) => {
        const [habits, stats] = await Promise.all([
          habitsService.findAll(userId),
          habitsService.getStatistics(userId),
        ]);
        return { habits, stats };
      },
    },

    // ── MUTATE ────────────────────────────────────────────────────────────────
    {
      name: 'habits_create',
      description:
        'Create a new habit for the current user. Requires user confirmation before execution.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          name: { type: 'string', description: 'Habit name (e.g. "Drink 8 glasses of water")' },
          description: { type: 'string', description: 'Optional description' },
          frequency_type: {
            type: 'string',
            enum: ['daily', 'weekly'],
            description: 'How often this habit repeats',
          },
          frequency_days: {
            type: 'array',
            items: { type: 'number' },
            description:
              'Days of week to repeat (0=Sunday … 6=Saturday). Required for weekly habits. Leave empty for daily.',
          },
          target_count: {
            type: 'number',
            description: 'How many times per session to complete (default: 1)',
          },
          reminder_time: {
            type: 'string',
            description: 'Optional reminder time in HH:mm format (e.g. "08:00")',
          },
        },
        required: ['name', 'frequency_type'],
      },
      type: 'MUTATE',
      execute: async (params, userId) => {
        return habitsService.create(
          {
            name: params.name as string,
            description: params.description as string | undefined,
            frequency_type: params.frequency_type as string,
            frequency_days: params.frequency_days as number[] | undefined,
            target_count: (params.target_count as number | undefined) ?? 1,
            reminder_time: params.reminder_time as string | undefined,
          },
          userId,
        );
      },
      describeAction: (params) =>
        `Create habit: "${params.name}" (${params.frequency_type})`,
    },

    {
      name: 'habits_log_today',
      description:
        "Log a check-in for a habit for today (or a specified date). Requires user confirmation. Get the habit ID from habits_get_overview.",
      inputSchema: {
        type: 'object' as const,
        properties: {
          habitId: { type: 'string', description: 'Habit ID (UUID)' },
          date: {
            type: 'string',
            description:
              "Date to log in YYYY-MM-DD format. Use today's date if not specified.",
          },
          count: {
            type: 'number',
            description: 'Number of completions to add (default: 1)',
          },
        },
        required: ['habitId', 'date'],
      },
      type: 'MUTATE',
      execute: async (params, userId) => {
        return habitsService.logHabit(
          params.habitId as string,
          userId,
          params.date as string,
          (params.count as number | undefined) ?? 1,
        );
      },
      describeAction: (params) =>
        `Log habit check-in: ID ${params.habitId} on ${params.date}`,
    },
  ];
}
