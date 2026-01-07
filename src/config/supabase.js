// src/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wdtpigxchzihmlxqsedu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkdHBpZ3hjaHppaG1seHFzZWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5ODc0OTcsImV4cCI6MjA4MjU2MzQ5N30.0v_bMgV1huRhfnl5ZYOWghowVKxKOjqcDQaWvRsre6w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)