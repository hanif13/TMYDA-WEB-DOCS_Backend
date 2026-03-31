import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Initialize and get the Supabase client with the provided URL and key.
 * In Cloudflare Workers, we use variables from the environment context.
 */
export const getSupabase = (supabaseUrl: string, supabaseKey: string): SupabaseClient => {
    if (!supabaseInstance) {
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase credentials missing in environment variables.");
        }
        supabaseInstance = createClient(supabaseUrl, supabaseKey);
    }
    return supabaseInstance;
};

/**
 * Uploads a file to Supabase Storage
 * @param bucket Bucket name
 * @param filePath Path within the bucket
 * @param fileBuffer Buffer, Blob, or Uint8Array
 * @param contentType MIME type
 * @param env Cloudflare Workers Environment Bindings
 */
export async function uploadToSupabase(
  bucket: string,
  filePath: string,
  fileBuffer: any,
  contentType: string,
  env: { SUPABASE_URL: string, SUPABASE_SERVICE_ROLE_KEY: string, SUPABASE_ANON_KEY: string }
) {
  const supabase = getSupabase(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY);
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: true
    });

  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}
