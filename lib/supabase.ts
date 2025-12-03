
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nedysuvdkmxcdrpuemqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZHlzdXZka214Y2RycHVlbXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NjY4NDEsImV4cCI6MjA4MDI0Mjg0MX0.bIuoCa6dp1UGy4FAKZ51v8CQ8jJ3EveFaKHUJGCOcKw';

export const supabase = createClient(supabaseUrl, supabaseKey);
