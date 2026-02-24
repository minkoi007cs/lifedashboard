export interface FoodEntry {
    id: string;
    name: string;
    amount: number;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    date: string;
    mealType: string;
    createdAt: string;
    updatedAt: string;
}

export interface WeightLog {
    id: string;
    weight: number;
    date: string;
    createdAt: string;
    updatedAt: string;
}

export interface DietPlan {
    id: string;
    targetCalories: number;
    proteinRatio: number;
    fatRatio: number;
    carbsRatio: number;
    startDate: string;
    endDate?: string;
    isActive: boolean;
}

export interface CaloriesStats {
    today: {
        calories: number;
        macros: {
            protein: number;
            fat: number;
            carbs: number;
        };
        target: number;
    };
    weightTrend: WeightLog[];
    allEntries: FoodEntry[];
    activePlan: DietPlan | null;
}
