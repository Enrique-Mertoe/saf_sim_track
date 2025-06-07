import {SIMCard} from "@/models/simCards";

export type SupabaseFilter = {
    column: keyof SIMCard | string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'ilike' | 'in' | 'is' | 'not';
    value: any;
};