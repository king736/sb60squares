import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type SquaresPage = {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export type SquareCell = {
  id: string
  page_id: string
  row: number
  col: number
  owner?: string
  image_url?: string
  created_at: string
}

export type Score = {
  id: string
  page_id: string
  quarter: number
  team_a_score: number
  team_b_score: number
  updated_at: string
}
