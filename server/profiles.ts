"use server"
import { cookies } from "next/headers"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"
import { getPlayerProfileUrlById } from "@/server/steam"
import { Database } from "@/supabase/database.types"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export async function getUserProfile(user_id: string): Promise<Result<Partial<Profile> & { spotify_linked: boolean }>> {
  const cookieStore = cookies()
  const client = createSupabaseServerClient(cookieStore)
  const { data, error, status } = await client.from("profiles").select("*").eq("user_id", user_id).single()
  const { data: spotifyData } = await client.from("spotify_data").select("expires_at").eq("user_id", user_id).single()

  if (error && status !== 406) {
    console.error(error.message)
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
  const cookieStore = cookies()
  const client = createSupabaseServerClient(cookieStore)
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
    console.error(error.message)
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
  avatarUrl: string
  username: string
  fullName: string | null
  spotifyId: string | null
  spotifyName: string | null
  steamUrl: string | null
  letterboxdUsername: string | null
  myAnimeListUsername: string | null
}

export async function getProfileData(userId: string): Promise<Result<ProfileData>> {
  try {
    const cookieStore = cookies()
    const client = createSupabaseServerClient(cookieStore)

    const { data, error, statusText } = await client
      .from("profiles")
      .select("username, full_name, avatar_url, steam_id, letterboxd_username, mal_username, spotify_id, spotify_data")
      .eq("user_id", userId)
      .single()

    if (error) {
      return {
        status: "error",
        message: "There was an error reading your profile",
        code: statusText,
      }
    }

    const steamId = await getPlayerProfileUrlById(data?.steam_id as string)

    return {
      status: "success",
      data: {
        avatarUrl: data?.avatar_url as string,
        username: data?.username as string,
        fullName: data?.full_name,
        spotifyId: data?.spotify_id as string,
        spotifyName: (data?.spotify_data as any)?.full_name as string,
        steamUrl: steamId.status === "success" ? steamId.data : null,
        letterboxdUsername: data?.letterboxd_username as string,
        myAnimeListUsername: data?.mal_username as string,
      },
    }
  } catch (error: any) {
    console.error(error.message)
    return {
      status: "error",
      message: "Could not find profile data",
    }
  }
}
