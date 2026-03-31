import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create standard clients for Node.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Compatibility helper for the migration from the Hono context.
 */
export const getSupabase = (env?: { SUPABASE_URL: string, SUPABASE_ANON_KEY: string }) => {
    return supabase;
};

export const getSupabaseAdmin = (env?: { SUPABASE_URL: string, SUPABASE_SERVICE_ROLE_KEY: string }) => {
    return supabaseAdmin;
};
