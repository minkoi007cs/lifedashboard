export const APP_NAME = "Life Dashboard";

// ── AI Assistant contract ─────────────────────────────────────────────────────
// These types are the canonical contract between backend and frontend.
// Backend exports them; frontend imports from '@life-dashboard/shared'.

/** One message in the conversation history sent to / received from the assistant. */
export interface AssistantMessage {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * A tool action surfaced to the frontend.
 *
 * status:
 *   'done'                — tool was executed this turn; `result` contains the outcome.
 *   'pending_confirmation' — MUTATE tool intercepted; frontend must show a confirm dialog
 *                           and re-send with `confirmedActions` containing this id + params.
 *   'failed'              — execution threw; `errorMessage` explains why.
 */
export interface AssistantAction {
    id: string;
    toolName: string;
    description: string;
    status: 'done' | 'pending_confirmation' | 'failed';
    result?: unknown;
    /** Params to replay on confirmation. Only present when status === 'pending_confirmation'. */
    params?: Record<string, unknown>;
    errorMessage?: string;
}

/**
 * One confirmed action the frontend sends back.
 * `params` must match what was returned in the prior `pending_confirmation` action —
 * userId is NOT in params; it is always injected from the JWT on the server.
 */
export interface ConfirmedAction {
    id: string;
    toolName: string;
    params: Record<string, unknown>;
}

/** POST /api/v1/assistant/chat — request body. */
export interface ChatRequest {
    messages: AssistantMessage[];
    /** Omit or send [] when there are no pending actions to confirm. */
    confirmedActions?: ConfirmedAction[];
}

/** POST /api/v1/assistant/chat — response body. */
export interface ChatResponse {
    reply: string;
    actions: AssistantAction[];
}


export interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    avatarUrl?: string;
}

export enum FrequencyType {
    DAILY = 'daily',
    WEEKLY = 'weekly'
}

export interface Habit {
    id: string;
    userId: string;
    name: string;
    description?: string;
    frequencyType: FrequencyType;
    frequencyDays: number[]; // 0-6 for Sun-Sat
    targetCount: number;
    reminderTime?: string; // HH:mm
    startDate: string;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
    streak: number;
    longestStreak: number;
    completionRate: number;
    totalCompletions: number;
    lastCompletedDate?: string;
    logs?: HabitLog[];
}

export interface HabitLog {
    id: string;
    habitId: string;
    date: string;
    completedCount: number;
    isCompleted: boolean;
    createdAt: string;
}

export interface CreateHabitDto {
    name: string;
    description?: string;
    frequencyType: FrequencyType;
    frequencyDays?: number[];
    targetCount?: number;
    reminderTime?: string;
    startDate?: string;
}

export interface UpdateHabitDto extends Partial<CreateHabitDto> {
    isArchived?: boolean;
}

export interface HabitStatistics {
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
    completionRate: number;
    weeklySummary: {
        date: string;
        completed: number;
        target: number;
    }[];
    monthlyHeatmap: {
        date: string;
        count: number;
    }[];
}
