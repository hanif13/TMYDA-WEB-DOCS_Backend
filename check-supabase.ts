import { supabaseAdmin } from './src/lib/supabase';

async function main() {
  const { data, error } = await supabaseAdmin.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  console.log('Buckets:', data);
  
  const uploadsBucket = data.find(b => b.name === 'uploads');
  if (!uploadsBucket) {
    console.error('Bucket "uploads" NOT FOUND!');
    // Try to create it? NO, just report.
  } else {
    console.log('Bucket "uploads" found.');
  }
}

main().catch(console.error);
