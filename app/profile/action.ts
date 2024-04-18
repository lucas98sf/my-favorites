"use server"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"
import { Database } from "@/supabase/database.types"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export async function authSpotify() {
  const supabase = createClient()

  const identities = await supabase.auth.getUserIdentities()
  console.log({ identities: JSON.stringify(identities, null, 2) })

  const redirectTo = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/auth/callback/spotify`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "spotify",
    options: {
      redirectTo,
      scopes: "user-read-email user-read-private",
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

  const { data, error, status } = await supabase.from("profiles").select("*").eq("user_id", user_id).single()

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

export async function getUserSpotifyData(): Promise<Result<string>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error, statusText } = await supabase
      .from("profiles")
      .select("spotify_token")
      .eq("user_id", user?.id)
      .single()

    if (error) {
      console.error(error)
      return {
        status: "error",
        message: "There was an error updating your profile",
        code: statusText,
      }
    }

    const spotifyData = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${data?.spotify_token}`,
      },
    })
      .then(res => res.json())
      .catch(error => {
        console.error(error)
        return {
          status: "error",
          message: "There was an error fetching your spotify data",
        }
      })

    return {
      status: "success",
      data: JSON.stringify(spotifyData, null, 2) as string,
    }
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Could not find spotify data",
    }
  }
}

export async function updateUserProfile(data: Partial<Profile & { user_id: string }>): Promise<Result> {
  console.log("!!!")
  const supabase = createClient()

  const { error, statusText } = await supabase.from("profiles").upsert(
    {
      user_id: data?.user_id,
      ...data,
    },
    {
      onConflict: "user_id",
    }
  )

  if (error) {
    if (error.code === "23505") {
      console.log(statusText)
      return {
        status: "error",
        message: "username already in use",
        code: statusText,
      }
    }
    console.error(error)
    return {
      status: "error",
      message: "There was an error updating your profile",
      code: statusText,
    }
  }

  return {
    status: "success",
    data: null,
  }
}
