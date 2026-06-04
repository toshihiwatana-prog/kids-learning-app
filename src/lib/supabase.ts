import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nickname: string
          grade: number
          prefecture: string
          city: string
          created_at: string
        }
        Insert: {
          id: string
          nickname: string
          grade: number
          prefecture: string
          city: string
          created_at?: string
        }
      }
      scores: {
        Row: {
          id: string
          user_id: string
          user_grade: number
          grade_challenged: number
          score: number
          correct_count: number
          max_combo: number
          prefecture: string
          city: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_grade: number
          grade_challenged: number
          score: number
          correct_count: number
          max_combo: number
          prefecture: string
          city: string
          created_at?: string
        }
      }
    }
  }
}
