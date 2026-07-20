import { FocusService } from '../../focus/focus.service';
import { ToolDefinition } from './tool-registry';

export function buildFocusTools(focusService: FocusService): ToolDefinition[] {
  return [
    // ── READ ─────────────────────────────────────────────────────────────────
    {
      name: 'focus_get_stats',
      description:
        "Get the current user's focus/deep-work statistics: total sessions, total minutes focused, and full session history. Use before answering any question about focus or productivity.",
      inputSchema: {
        type: 'object' as const,
        properties: {},
        required: [],
      },
      type: 'READ',
      execute: async (_params, userId) => {
        const [stats, sessions] = await Promise.all([
          focusService.getStats(userId),
          focusService.findAll(userId),
        ]);
        return { stats, sessions };
      },
    },

    // ── MUTATE ────────────────────────────────────────────────────────────────
    {
      name: 'focus_log_session',
      description:
        'Record a completed focus/deep-work session for the current user. Requires user confirmation before execution.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          startTime: {
            type: 'string',
            description: 'Session start time in ISO 8601 format (e.g. "2024-01-15T09:00:00Z")',
          },
          durationMinutes: {
            type: 'number',
            description: 'How many minutes the session lasted',
          },
          label: {
            type: 'string',
            description: 'Optional label/category for the session (e.g. "Coding", "Reading")',
          },
        },
        required: ['startTime', 'durationMinutes'],
      },
      type: 'MUTATE',
      execute: async (params, userId) => {
        const start = new Date(params.startTime as string);
        const durationMinutes = params.durationMinutes as number;
        const end = new Date(start.getTime() + durationMinutes * 60_000);
        return focusService.create(
          {
            startTime: start,
            endTime: end,
            durationMinutes,
            label: params.label as string | undefined,
          },
          userId,
        );
      },
      describeAction: (params) =>
        `Log focus session: ${params.durationMinutes} min starting ${params.startTime}${params.label ? ` [${params.label}]` : ''}`,
    },
  ];
}
