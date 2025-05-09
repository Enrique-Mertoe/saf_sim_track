import {createClient} from "@supabase/supabase-js";
import {Database} from "@/types/database.types";

export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase server environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey);
};