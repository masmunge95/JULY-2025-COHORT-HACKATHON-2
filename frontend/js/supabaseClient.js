import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://ssmddcoxoocqitjjlnfs.supabase.co'; // Replace with your Supabase URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbWRkY294b29jcWl0ampsbmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzAyMDUsImV4cCI6MjA3MjIwNjIwNX0.bSDGrMrYPSN0R_QoY0QehNENYZjs7jU_uueScvP_MlQ'; // Replace with your Supabase anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);