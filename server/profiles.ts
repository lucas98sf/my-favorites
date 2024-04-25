"use server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"
import { Database } from "@/supabase/database.types"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export async function getUserProfile(user_id: string): Promise<Result<Partial<Profile> & { spotify_linked: boolean }>> {
  const client = createSupabaseServerClient()
  const { data, error, status } = await client.from("profiles").select("*").eq("user_id", user_id).single()
  const { data: spotifyData } = await client.from("spotify_data").select("expires_at").eq("user_id", user_id).single()

  if (error && status !== 406) {
    console.error(error)
  }

  if (data) {
    return {
      status: "success",
      data: {
        ...data,
        spotify_linked: !!spotifyData,
      },
    }
  } else {
    return {
      status: "error",
      message: "Profile not found",
    }
  }
}

export async function updateUserProfile(data: Partial<Profile & { user_id: string }>): Promise<Result> {
  const client = createSupabaseServerClient()
  const { error, statusText } = await client.from("profiles").upsert(
    {
      ...data,
      user_id: data?.user_id,
    },
    {
      onConflict: "user_id",
    }
  )

  if (error) {
    if (error.code === "23505") {
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

export type ProfileData = {
  avatar_url: string
  username: string | null
  full_name: string | null
}

export async function getProfileData(): Promise<Result<ProfileData>> {
  try {
    const client = createSupabaseServerClient()
    const {
      data: { user },
    } = await client.auth.getUser()

    const { data, error, statusText } = await client
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("user_id", user?.id as string)
      .single()

    if (error) {
      return {
        status: "error",
        message: "There was an error reading your profile",
        code: statusText,
      }
    }

    return {
      status: "success",
      data: {
        avatar_url: data?.avatar_url as string,
        username: data?.username,
        full_name: data?.full_name,
      },
    }
  } catch (error) {
    return {
      status: "error",
      message: "Could not find spotify data",
    }
  }
}
