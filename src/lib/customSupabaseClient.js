import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://srasruhpkgjcmmsnjvlp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyYXNydWhwa2dqY21tc25qdmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTk4MzMsImV4cCI6MjA2NjEzNTgzM30.pGvyvGIpUYDvnGqVgN70GR39Jkmm9iYC6z0GtBDcRME';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
