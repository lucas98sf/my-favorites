import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut({ scope: "local" })
  }

  revalidatePath("/", "layout")
  return NextResponse.redirect(new URL("/login", req.url), {
    status: 302,
  })
}
