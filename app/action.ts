"use server"
import { createClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"

export async function getUserData(): Promise<Result<any>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error, statusText } = await supabase
      .from("profiles")
      .select("username, full_name, spotify_token")
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

    const spotifyData = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=3", {
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

    if (spotifyData.error?.status === 401) {
      // await supabase.auth.refreshSession()
      return {
        status: "error",
        message: "Spotify token is invalid",
      }
    }

    console.log({ spotifyData: spotifyData.items })

    return {
      status: "success",
      data: {
        avatar_url: user?.user_metadata?.avatar_url,
        username: data.username,
        full_name: data.full_name,
        spotifyData: spotifyData.items,
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
