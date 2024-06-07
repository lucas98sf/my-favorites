import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { generateSlug } from "random-word-slugs"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function NewUserPage({ params }: { params: { userId: string } }) {
  const cookieStore = cookies()
  const client = createSupabaseServerClient(cookieStore)

  const { error } = await client
    .from("profiles")
    .upsert(
      {
        username: generateSlug().slice(0, 20).replaceAll(/-/g, "_"),
      },
      {
        onConflict: "user_id",
      }
    )
    .eq("user_id", params.userId)
    .select()
    .single()

  if (error) {
    console.error(error.message)
    return
  }

  redirect("/profile")
}
