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

    await supabase.from("profiles").update({ spotify_token: session?.provider_token }).eq("user_id", session?.user.id)
  }

  return redirect(origin)
}
