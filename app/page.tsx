"use client"
import { redirect, useSearchParams } from "next/navigation"

import ProfileForm from "@/components/Profile"

export default function ProfilePage() {
  const params = useSearchParams()
  const code = params.get("code")

  if (code) {
    redirect(`/auth/callback?code=${code}`)
  }

  return <ProfileForm />
}
