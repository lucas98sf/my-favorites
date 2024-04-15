"use client"
import { redirect, useSearchParams } from "next/navigation"

export default function ProfilePage() {
  const params = useSearchParams()
  const code = params.get("code")

  if (code) {
    redirect(`/auth/callback?code=${code}`)
  }

  return <></>
}
