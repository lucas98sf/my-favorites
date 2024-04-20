import { redirect } from "next/navigation"
import { type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.exchangeCodeForSession(code)
    const { error } = await supabase
      .from("spotify_data")
      .upsert(
        {
          access_token: session?.provider_token,
          refresh_token: session?.provider_refresh_token,
          expires_at: session?.expires_at,
        },
        {
          onConflict: "user_id",
        }
      )
      .eq("user_id", session?.user.id)

    if (error) {
      console.error(error)
      return redirect(`${origin}/error`)
    }
  }

  return redirect(origin)
}
