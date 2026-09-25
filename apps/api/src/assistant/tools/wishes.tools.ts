import { WishesService } from '../../wishes/wishes.service';
import { WishTimeTag, WishType } from '../../wishes/wish.entity';
import { ToolDefinition } from './tool-registry';

export function buildWishesTools(wishesService: WishesService): ToolDefinition[] {
  return [
    // ── READ ─────────────────────────────────────────────────────────────────
    {
      name: 'wishes_get_mine',
      description:
        "Get the current user's own wishes/wishlist: all wishes they created, with share counts, response summaries, and plan status. Use before answering any question about the user's wishlist.",
      inputSchema: {
        type: 'object' as const,
        properties: {},
        required: [],
      },
      type: 'READ',
      execute: async (_params, userId) => {
        return wishesService.getMine(userId);
      },
    },

    // ── MUTATE ────────────────────────────────────────────────────────────────
    {
      name: 'wishes_create',
      description:
        'Add a new wish to the current user\'s wishlist. Requires user confirmation before execution.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          title: { type: 'string', description: 'Wish title (e.g. "Trip to Japan")' },
          description: { type: 'string', description: 'Optional details about the wish' },
          type: {
            type: 'string',
            enum: ['gift', 'activity', 'goal'],
            description: 'Wish type: "gift" = something to receive, "activity" = shared experience, "goal" = personal goal',
          },
          timeTag: {
            type: 'string',
            enum: ['today', 'this_week', 'soon'],
            description: 'When the user wants this wish: "today", "this_week", or "soon"',
          },
        },
        required: ['title', 'type', 'timeTag'],
      },
      type: 'MUTATE',
      execute: async (params, userId) => {
        return wishesService.create(
          {
            title: params.title as string,
            description: params.description as string | undefined,
            type: params.type as WishType,
            timeTag: params.timeTag as WishTimeTag,
          },
          userId,
        );
      },
      describeAction: (params) =>
        `Add wish: "${params.title}" (${params.type})${params.timeTag ? ` – ${params.timeTag}` : ''}`,
    },

    {
      name: 'wishes_delete',
      description:
        'Delete a wish from the wishlist. Only the owner can delete. Requires user confirmation. Get the wish ID from wishes_get_mine.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'Wish ID (UUID)' },
        },
        required: ['id'],
      },
      type: 'MUTATE',
      execute: async (params, userId) => {
        return wishesService.remove(params.id as string, userId);
      },
      describeAction: (params) => `Delete wish ID: ${params.id}`,
    },
  ];
}
