// ── AI Assistant contract ─────────────────────────────────────────────────────

/** One message in the conversation history sent to / received from the assistant. */
export interface AssistantMessage {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * A tool action surfaced to the frontend.
 *
 * status:
 *   'done'                 — executed this turn; `result` has the outcome.
 *   'pending_confirmation' — MUTATE tool queued; frontend must show a confirm dialog
 *                            and re-send with `confirmedActions` containing id + params.
 *   'failed'               — execution threw; `errorMessage` explains why.
 */
export interface AssistantAction {
    id: string;
    toolName: string;
    description: string;
    status: 'done' | 'pending_confirmation' | 'failed';
    result?: unknown;
    /** Only present when status === 'pending_confirmation'. Echo back on confirmation. */
    params?: Record<string, unknown>;
    errorMessage?: string;
}

/**
 * One confirmed action the frontend sends back.
 * `params` must match what was returned in the prior pending_confirmation action.
 * userId is NOT in params — always injected server-side from the JWT.
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

// ── AI Assistant SSE Streaming (POST /api/v1/assistant/chat/stream) ───────────
//
// Each event is sent as:  data: {JSON}\n\n
// Discriminate by `type` field. Always ends with a `done` event (even after `error`).

/** A chunk of text to append to the in-progress reply. Emit one per SDK text_delta. */
export interface StreamDelta {
    type: 'delta';
    text: string;
}

/**
 * One tool action surfaced mid-stream.
 * READ tools emit `done` immediately after execution.
 * MUTATE tools emit `pending_confirmation` — frontend must show confirm dialog,
 * then re-POST to /chat with confirmedActions[] to execute.
 */
export interface StreamAction {
    type: 'action';
    action: AssistantAction;
}

/**
 * Terminal event — stream is complete.
 * `reply` is the full accumulated text (all prior deltas joined) for reconciliation.
 * `actions` is the complete list for the turn.
 * Always emitted last, even when preceded by an `error` event.
 */
export interface StreamDone {
    type: 'done';
    reply: string;
    actions: AssistantAction[];
}

/**
 * A non-fatal error occurred (e.g. rate-limit, bad API key).
 * Always followed by a `done` event so the frontend can close cleanly.
 */
export interface StreamError {
    type: 'error';
    message: string;
}

/** Discriminated union of all SSE payloads for POST /api/v1/assistant/chat/stream. */
export type StreamEvent = StreamDelta | StreamAction | StreamDone | StreamError;

// ── Finance ───────────────────────────────────────────────────────────────────

/** One income/sales entry. Maps to FinanceSale entity. */
export interface FinanceSale {
    id: string;
    createdAt: string;
    updatedAt: string;
    date: string;           // YYYY-MM-DD
    serviceSales: number;
    cashTips: number;
    ccTips: number;
    commissionBase: number;
    cashCommission: number;
    checkCommission: number;
    taxAmount: number;
    netCheck: number;
    description: string;
    receiptImage?: string;
    userId: string;
}

/** One expense entry. Maps to FinanceExpense entity. */
export interface FinanceExpense {
    id: string;
    createdAt: string;
    updatedAt: string;
    date: string;           // YYYY-MM-DD
    amount: number;
    description: string;
    category: string;
    receiptImage?: string;
    userId: string;
}

/** Response shape of GET /finance/statistics. */
export interface FinanceStats {
    totalExpenses: number;
    totalRealProfit: number;
    totalCheckIncome: number;
    totalCashIncome: number;
    totalGrossIncome: number;
    totalTaxAmount: number;
    totalNetIncome: number;
    sales: FinanceSale[];
    expenses: FinanceExpense[];
}

// ── Calories ─────────────────────────────────────────────────────────────────

/** One logged food entry. Maps to FoodEntry entity. */
export interface FoodEntry {
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    amount: number;         // grams or servings
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    date: string;           // YYYY-MM-DD
    mealType: string;       // breakfast | lunch | dinner | snack
    userId: string;
}

/** One weight log entry. Maps to WeightLog entity. */
export interface WeightLog {
    id: string;
    createdAt: string;
    updatedAt: string;
    weight: number;
    date: string;           // YYYY-MM-DD
    userId: string;
}

/** Active diet plan. Maps to DietPlan entity. */
export interface DietPlan {
    id: string;
    createdAt: string;
    updatedAt: string;
    targetCalories: number;
    proteinRatio: number;   // percentage
    fatRatio: number;
    carbsRatio: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    userId: string;
}

/** Response shape of GET /calories/statistics. */
export interface CaloriesStats {
    today: {
        calories: number;
        macros: { protein: number; fat: number; carbs: number };
        target: number;
    };
    weightTrend: WeightLog[];
    allEntries: FoodEntry[];
    activePlan: DietPlan | null;
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export type TaskStatus = 'TODO' | 'DOING' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

/** One task. Maps to Task entity. */
export interface Task {
    id: string;
    createdAt: string;
    updatedAt: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
    reminderTime: string | null;
    startDate: string | null;
    endDate: string | null;
    isSharedPlan: boolean;
    sourceWishId: string | null;
    userId: string;
    participants: TaskParticipant[];
}

export interface TaskParticipant {
    id: string;
    taskId: string;
    userId: string;
}

/** Response shape of GET /tasks/statistics. */
export interface TaskStats {
    total: number;
    statusStats: { done: number; pending: number };
    priorityStats: { low: number; medium: number; high: number };
}

// ── Focus ─────────────────────────────────────────────────────────────────────

/** One focus session. Maps to FocusSession entity. */
export interface FocusSession {
    id: string;
    createdAt: string;
    updatedAt: string;
    startTime: string;      // ISO datetime
    endTime: string;        // ISO datetime
    durationMinutes: number;
    label: string | null;
    userId: string;
}

/** Response shape of GET /focus/stats. */
export interface FocusStats {
    totalMinutes: number;
    count: number;
}

// ── Habits ────────────────────────────────────────────────────────────────────

/** One habit. Maps to Habit entity (camelCase since Phase B migration). */
export interface Habit {
    id: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    description: string;
    frequencyType: string;      // 'daily' | 'weekly'
    frequencyDays: number[];    // 0–6 for Sun–Sat
    targetCount: number;
    reminderTime: string | null;
    startDate: string | null;
    isArchived: boolean;
    streak: number;
    longestStreak: number;
    userId: string;
    logs: HabitLog[];
}

/** One habit log entry. Maps to HabitLog entity. */
export interface HabitLog {
    id: string;
    createdAt: string;
    updatedAt: string;
    date: string;               // YYYY-MM-DD
    completedCount: number;
    isCompleted: boolean;
    habitId: string;
}

/** Response shape of GET /habits/statistics. */
export interface HabitStatistics {
    totalCompletions: number;
    activeHabits: number;
    archivedHabits: number;
    weeklySummary: { date: string; completed: number; target: number }[];
    monthlyHeatmap: { date: string; count: number }[];
}

/** POST /habits body. */
export interface CreateHabitPayload {
    name: string;
    description?: string;
    frequencyType: 'daily' | 'weekly';
    frequencyDays?: number[];
    targetCount?: number;
    reminderTime?: string;
    startDate?: string;
}

/** PUT /habits/:id body. */
export type UpdateHabitPayload = Partial<CreateHabitPayload> & {
    isArchived?: boolean;
};

// ── Wishlist ──────────────────────────────────────────────────────────────────

export type WishType = 'activity' | 'item';
export type WishTimeTag = 'today' | 'this_week' | 'soon';
export type WishResponseStatus = 'confirmed' | 'declined' | 'commented';

/** One wish entry (owner view). Maps to WishesService.getMine() shape. */
export interface WishEntry {
    id: string;
    createdAt: string;
    updatedAt: string;
    title: string;
    description: string | undefined;
    type: WishType;
    timeTag: WishTimeTag;
    wasEdited: boolean;
    planTaskId: string | undefined;
    planCreatedAt: Date | undefined;
    shareCount: number;
    shares: {
        id: string;
        recipient: { id: string; name: string; email: string; avatarUrl: string };
    }[];
    responseSummary: { confirmed: number; declined: number; comments: number };
    responses: {
        id: string;
        status: WishResponseStatus;
        comment: string | undefined;
        addToPlan: boolean;
        respondedAt: Date;
        responder: { id: string; name: string; email: string; avatarUrl: string };
    }[];
    comments: {
        id: string;
        comment: string;
        createdAt: Date;
        author: { id: string; name: string; email: string; avatarUrl: string };
    }[];
}
