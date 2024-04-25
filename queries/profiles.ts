import { Result, SupabaseClient } from "@/lib/types"
import { Database } from "@/supabase/database.types"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export async function getUserProfile(
  client: SupabaseClient,
  user_id: string
): Promise<Result<Partial<Profile> & { spotify_linked: boolean }>> {
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

export async function updateUserProfile(
  client: SupabaseClient,
  data: Partial<Profile & { user_id: string }>
): Promise<Result> {
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

export async function getProfileData(client: SupabaseClient): Promise<Result<ProfileData>> {
  try {
    const {
      data: { user },
    } = await client.auth.getUser()

    const { data, error, statusText } = await client
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("user_id", user?.id as string)
      .single()

    if (error) {
      console.error(error)
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
    console.error(error)
    return {
      status: "error",
      message: "Could not find spotify data",
    }
  }
}
