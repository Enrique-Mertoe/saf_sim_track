import {Database} from "@/types/database.types";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// For client-side usage
export const createSupabaseClient = () => {
   return createClientComponentClient<Database>();
};