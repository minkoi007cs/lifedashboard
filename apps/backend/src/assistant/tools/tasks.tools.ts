import { TasksService } from '../../tasks/tasks.service';
import { TaskPriority, TaskStatus } from '../../tasks/task.entity';
import { ToolDefinition } from './tool-registry';

export function buildTasksTools(tasksService: TasksService): ToolDefinition[] {
  return [
    // ── READ ─────────────────────────────────────────────────────────────────
    {
      name: 'tasks_get_overview',
      description:
        "Get the current user's task overview: all tasks with their status and priority, plus summary statistics (done/pending counts, priority breakdown). Use before answering any question about tasks.",
      inputSchema: {
        type: 'object' as const,
        properties: {},
        required: [],
      },
      type: 'READ',
      execute: async (_params, userId) => {
        const [tasks, stats] = await Promise.all([
          tasksService.findAll(userId),
          tasksService.getStatistics(userId),
        ]);
        return { tasks, stats };
      },
    },

    // ── MUTATE ────────────────────────────────────────────────────────────────
    {
      name: 'tasks_create',
      description:
        'Create a new task for the current user. Requires user confirmation before execution.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          title: { type: 'string', description: 'Task title' },
          description: { type: 'string', description: 'Optional task details' },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Task priority (default: medium)',
          },
          dueDate: {
            type: 'string',
            description: 'Due date in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ)',
          },
        },
        required: ['title'],
      },
      type: 'MUTATE',
      execute: async (params, userId) => {
        return tasksService.create(
          {
            title: params.title as string,
            description: params.description as string | undefined,
            priority: (params.priority as TaskPriority) ?? TaskPriority.MEDIUM,
            status: TaskStatus.TODO,
            dueDate: params.dueDate ? new Date(params.dueDate as string) : undefined,
          },
          userId,
        );
      },
      describeAction: (params) =>
        `Create task: "${params.title}"${params.dueDate ? ` (due ${params.dueDate})` : ''}`,
    },

    {
      name: 'tasks_mark_done',
      description:
        'Mark a task as completed. Requires user confirmation. Get the task ID from tasks_get_overview.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'Task ID (UUID)' },
        },
        required: ['id'],
      },
      type: 'MUTATE',
      execute: async (params, userId) => {
        return tasksService.update(params.id as string, { status: TaskStatus.DONE }, userId);
      },
      describeAction: (params) => `Mark task done: ID ${params.id}`,
    },
  ];
}
