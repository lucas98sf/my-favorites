"use client"
import { User } from "@supabase/supabase-js"
import { redirect, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { ErrorAlert } from "@/components/ErrorAlert"
import { SuccessAlert } from "@/components/SuccessAlert"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/supabase/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export default function Profile() {
  const params = useSearchParams()
  const code = params.get("code")

  if (code) {
    redirect(`/auth/callback?code=${code}`)
  }

  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<Profile | null>(null)

  const [user, setUser] = useState<User | null>(null)

  const getUser = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUser(user)

    setLoading(false)
  }, [supabase])

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const { data, error, status } = await supabase.from("profiles").select("*").eq("user_id", user?.id).single()

      if (error && status !== 406) {
        console.log(error)
        throw error
      }

      if (data) {
        setProfileData(data)
      }
    } catch (error: any) {
      setError(error.message)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [supabase, user?.id])

  useEffect(() => {
    if (!user) {
      getUser()
    } else {
      getProfile()
    }
  }, [user, getProfile, getUser])

  return loading
    ? "Loading..."
    : profileData && (
        <Card className="m-auto py-10 p-8 mx-24">
          {success && <SuccessAlert message={success} />}
          {error && <ErrorAlert message={error} />}
          {JSON.stringify(profileData, null, 2)}
        </Card>
      )
}
