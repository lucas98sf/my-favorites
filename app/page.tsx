import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function IndexPage({ searchParams }: { searchParams: Record<string, string> }) {
  const code = searchParams["code"]

  if (code) {
    redirect(`/auth/callback?code=${code}`)
  }

  const client = createSupabaseServerClient()

  const {
    data: { user },
  } = await client.auth.getUser()

  if (user?.id) {
    const { data } = await client.from("profiles").select("username").eq("user_id", user.id).single()

    if (data?.username) {
      redirect(`/user/${data.username}`)
    }
  }

  redirect("/login")
}
