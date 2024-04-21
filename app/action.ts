"use server"
import { filter, takeRight } from "lodash"

import { createClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"
import { Database } from "@/supabase/database.types"

export type Favorites = Database["public"]["Tables"]["favorites"]["Row"]

export type FavoriteType = "tracks" | "movies" | "games" | "animes"

export type Data = {
  type: FavoriteType
  items: {
    id: string
    title: string
    description: string
    image: string
    rating?: number
  }[]
}

export async function handleFavorites(
  currentData: any,
  id: string,
  type: FavoriteType,
  action: "add" | "remove" = "add"
) {
  return action === "remove"
    ? { [type]: filter(currentData?.[type] ?? [], currentDataId => currentDataId !== id) }
    : { [type]: takeRight([...(currentData?.[type] ?? []), id], 3) }
}

export async function getFavorites(): Promise<Result<Data>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error, statusText } = await supabase
      .from("favorites")
      .select("tracks")
      .eq("user_id", user?.id)
      .single()

    if (error) {
      console.error(error)
      return {
        status: "error",
        message: "There was an error getting your favorites",
        code: statusText,
      }
    }

    const spotifyToken = await getSpotifyToken()

    const favorites = await Promise.all(
      data.tracks.map(async (trackId: string) =>
        fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: {
            Authorization: `Bearer ${spotifyToken?.data?.access_token}`,
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
      )
    )

    if (favorites.some((res: any) => res.error?.status === 401)) {
      await supabase.auth.refreshSession(spotifyToken?.data?.refresh_token)
    }

    return {
      status: "success",
      data: {
        type: "tracks",
        items: favorites.map((data: any) => {
          return {
            id: data.id,
            title: data.name,
            image: data.album?.images?.[0]?.url,
            description: data.artists?.[0]?.name,
          }
        }),
      },
    }
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Could not find favorites",
    }
  }
}

export async function favoriteItem(
  id: string,
  type: FavoriteType,
  action: "add" | "remove" = "add"
): Promise<Result<Favorites["tracks"]>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: currentData } = await supabase.from("favorites").select("*").eq("user_id", user?.id).single()

    const update = await handleFavorites(currentData, id, type, action)

    const { data, error, statusText } = await supabase
      .from("favorites")
      .upsert(
        {
          user_id: user?.id,
          ...update,
        },
        { onConflict: "user_id" }
      )
      .select(type)
      .single()

    if (error) {
      console.error(error)
      return {
        status: "error",
        message: `There was an error ${action === "add" ? "adding" : "removing"} this item from your favorites`,
        code: statusText,
      }
    }

    return {
      status: "success",
      data: (data as any)[type],
    }
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: `Could not ${action === "add" ? "add" : "remove"} item from favorites`,
    }
  }
}

export async function getSpotifyToken() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error, statusText } = await supabase
    .from("spotify_data")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", user?.id)
    .single()

  if (error) {
    console.error(error)
    return {
      status: "error",
      message: "There was an error getting your spotify token",
      code: statusText,
    }
  }

  return {
    status: "success",
    data: {
      access_token: data?.access_token,
      refresh_token: data?.refresh_token,
      expires_at: data?.expires_at,
    },
  }
}

export async function getSpotifyData(limit = 3): Promise<Result<Data>> {
  try {
    const supabase = createClient()
    const spotifyToken = await getSpotifyToken()

    if (spotifyToken.status === "error") {
      return {
        status: "error",
        message: "There was an error getting your spotify data",
      }
    }

    const spotifyApiData = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${spotifyToken?.data?.access_token}`,
      },
    })
      .then(res => res.json().then(data => data.items))
      .catch(error => {
        console.error(error)
        return {
          status: "error",
          message: "There was an error fetching your spotify data",
        }
      })

    if (!spotifyApiData || spotifyApiData.error?.status === 401) {
      const newSession = await supabase.auth.refreshSession(spotifyToken?.data?.refresh_token)

      console.log({ newSession })
    }

    return {
      status: "success",
      data: {
        type: "tracks",
        items: spotifyApiData.map((data: any) => {
          return {
            id: data.id,
            title: data.name,
            image: data.album?.images?.[0]?.url,
            description: data.artists?.[0]?.name,
          }
        }),
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

export async function getUserData(): Promise<Result<any>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data, error, statusText } = await supabase
      .from("profiles")
      .select("username, full_name")
      .eq("user_id", user?.id)
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
        avatar_url: user?.user_metadata?.avatar_url,
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
