import { redirect } from "next/navigation"
import { type NextRequest } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin

  if (code) {
    const supabase = createSupabaseServerClient()
    const {
      data: { session, user },
    } = await supabase.auth.exchangeCodeForSession(code)

    //filter spotify auth by checking if it's not an google token
    if (!session?.provider_token?.startsWith("ya29.")) {
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
        .eq("user_id", session?.user.id as string)

      if (error) {
        console.error(error)
        return redirect("/error")
      }
    }
  }

  return redirect(origin)
}
