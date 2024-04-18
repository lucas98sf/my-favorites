import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = createClient()

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
