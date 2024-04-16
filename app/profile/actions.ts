"use server"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"
import { Database } from "@/supabase/database.types"

export type Profile = Database["public"]["Views"]["profiles_view"]["Row"]

export async function authSpotify() {
  const supabase = createClient()

  const identities = await supabase.auth.getUserIdentities()
  console.log({ identities: JSON.stringify(identities, null, 2) })

  const redirectTo = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/auth/callback/spotify`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "spotify",
    options: {
      redirectTo,
      queryParams: {
        grant_type: "authorization_code",
      },
    },
  })

  if (error) {
    console.error(error)
    return {
      status: "error",
      message: "An error occurred",
    }
  }

  redirect(data.url)
}

export async function getUserProfile(user_id: string): Promise<Result<Profile>> {
  const supabase = createClient()

  const { data, error, status } = await supabase.from("profiles_view").select("*").eq("user_id", user_id).single()

  if (error && status !== 406) {
    console.error(error)
  }

  if (data) {
    return {
      status: "success",
      data,
    }
  } else {
    return {
      status: "error",
      message: "Profile not found",
    }
  }
}

export async function getUserSpotifyAccessToken(): Promise<Result<string>> {
  try {
    const supabase = createClient()

    const { data, error, status } = await supabase.from("user_spotify_token_view").select("*").single()

    console.log({ data, error, status })

    if (error && status !== 406) {
      console.error(error)
    }

    if (data) {
      const expireDate = new Date(data.auth_code_issued_at).setHours(new Date(data.auth_code_issued_at).getHours() + 1)
      if (expireDate < new Date().getTime()) {
        // const { data: newSessionData, error: newSessionError } = await supabase.auth.setSession({
        //   access_token: data.provider_access_token,
        //   refresh_token: data.provider_refresh_token,
        // })

        // console.log({ newSessionData, newSessionError })

        const { data: refreshedData, error: refreshSessionError } = await supabase.auth.refreshSession({
          refresh_token: data.provider_refresh_token,
        })

        console.log({ refreshedData, refreshSessionError })

        if (error && status !== 406) {
          console.error(error)
        }
        return {
          status: "success",
          data: refreshedData?.session?.access_token as string,
        }
      }

      return {
        status: "success",
        data: data.access_token,
      }
    }

    throw new Error("No spotify token found")
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "could not find spotify data",
    }
  }
}

export async function updateUserProfile(data: Partial<Profile & { user_id: string }>): Promise<Result> {
  const supabase = createClient()

  const { error, status } = await supabase.from("profiles").upsert(
    {
      user_id: data?.user_id,
      ...data,
    },
    {
      onConflict: "user_id",
    }
  )

  //@todo: handle username already in use

  if (error) {
    console.error(error)
    return {
      status: "error",
      message: "There was an error updating your profile",
    }
  }

  return {
    status: "success",
    data: null,
  }
}
