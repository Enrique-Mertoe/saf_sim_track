import {Database} from "@/types/database.types";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// For client-side usage
export const createSupabaseClient = () => {
  // const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  // const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  //
  // if (!supabaseUrl || !supabaseAnonKey) {
  //   throw new Error('Missing Supabase environment variables');
  // }

  return createClientComponentClient<Database>();
};