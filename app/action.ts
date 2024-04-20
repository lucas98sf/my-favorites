"use server"
import { createClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"

export async function getUserData(): Promise<Result<any>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const {
      data: spotifyData,
      error: spotifyError,
      statusText: spotifyStatusText,
    } = await supabase
      .from("spotify_data")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user?.id)
      .single()

    if (spotifyError) {
      console.error(spotifyError)
      return {
        status: "error",
        message: "There was an error reading your profile",
        code: spotifyStatusText,
      }
    }

    const { data, error, statusText } = await supabase
      .from("profiles")
      .select("username, full_name")
      .eq("user_id", user?.id)
      .single()

    if (error) {
      console.error(spotifyError)
      return {
        status: "error",
        message: "There was an error reading your profile",
        code: statusText,
      }
    }

    const spotifyApiData = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=3", {
      headers: {
        Authorization: `Bearer ${spotifyData?.access_token}`,
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

    if (spotifyApiData.error?.status === 401) {
      await supabase.auth.refreshSession(spotifyData?.refresh_token)
    }

    return {
      status: "success",
      data: {
        avatar_url: user?.user_metadata?.avatar_url,
        username: data?.username,
        full_name: data?.full_name,
        spotifyData: spotifyApiData.items,
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
