import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm'

const SUPABASE_URL = "https://orrurfdexyzdhtuafodn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycnVyZmRleHl6ZGh0dWFmb2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTcyMzYsImV4cCI6MjA4MDA5MzIzNn0.WJ0nXKlyCNxPkrtHzyMt3TK-TUEzPkmgLrwNFnKBPus";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);