import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Hiányzik a Supabase URL vagy a publishable kulcs.')
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)
