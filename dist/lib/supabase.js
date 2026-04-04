"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseAdmin = exports.getSupabase = exports.supabaseAdmin = exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
// Create standard clients for Node.js
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
exports.supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
/**
 * Compatibility helper for the migration from the Hono context.
 */
const getSupabase = (env) => {
    return exports.supabase;
};
exports.getSupabase = getSupabase;
const getSupabaseAdmin = (env) => {
    return exports.supabaseAdmin;
};
exports.getSupabaseAdmin = getSupabaseAdmin;
