import { createBrowserClient } from "@supabase/ssr"
import { useMemo } from "react"

import type { SupabaseClient } from "@/lib/types"
import type { Database } from "@/supabase/database.types"

let client: SupabaseClient | undefined

function getSupabaseBrowserClient() {
  if (client) {
    return client
  }

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}

function useSupabaseBrowser() {
  return useMemo(getSupabaseBrowserClient, [])
}

export default useSupabaseBrowser
