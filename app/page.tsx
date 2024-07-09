import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export default async function IndexPage({ searchParams }: { searchParams: Record<string, string> }) {
  const code = searchParams["code"]

  if (code) {
    redirect(`/auth/callback?code=${code}`)
  }

  const cookieStore = cookies()
  const client = createSupabaseServerClient(cookieStore)

  const {
    data: { user },
  } = await client.auth.getUser()

  if (user?.id) {
    const { data } = await client.from("profiles").select("username").eq("user_id", user.id).single()

    if (data?.username) {
      redirect(`/${data.username}`)
    } else {
      redirect(`/new-user/${user.id}`)
    }
  }

  redirect("/login")
}
