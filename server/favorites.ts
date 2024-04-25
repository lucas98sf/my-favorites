"use server"
import { filter, takeRight } from "lodash"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"
import { getSpotifyToken } from "@/server/spotify"
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

export async function getFavorites(): Promise<Result<Data>> {
  try {
    const client = createSupabaseServerClient()
    const {
      data: { user },
    } = await client.auth.getUser()

    const { data, error, statusText } = await client
      .from("favorites")
      .select("tracks")
      .eq("user_id", user?.id as string)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return {
          status: "success",
          data: {
            type: "tracks",
            items: [],
          },
        }
      }
      return {
        status: "error",
        message: "There was an error getting your favorites",
        code: statusText,
      }
    }

    const spotifyToken = await getSpotifyToken()

    if (spotifyToken.status === "error") {
      return {
        status: "error",
        message: spotifyToken.message,
      }
    }

    const favorites = await Promise.all(
      data.tracks?.map(async (trackId: string) =>
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
      await client.auth.refreshSession({ refresh_token: spotifyToken?.data?.refresh_token as string })
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
    return {
      status: "error",
      message: "Could not find favorites",
    }
  }
}

export async function handleFavorites({
  currentData,
  id,
  type,
  action = "add",
}: {
  currentData: any
  id: string
  type: FavoriteType
  action: "add" | "remove"
}) {
  return action === "remove"
    ? { [type]: filter(currentData?.[type] ?? [], currentDataId => currentDataId !== id) }
    : { [type]: takeRight([...(currentData?.[type] ?? []), id], 4) }
}

export async function favoriteItem({
  id,
  type,
  action = "add",
}: {
  id: string
  type: FavoriteType
  action: "add" | "remove"
}): Promise<Result<Favorites["tracks"]>> {
  try {
    const client = createSupabaseServerClient()
    const {
      data: { user },
    } = await client.auth.getUser()

    const { data: currentData } = await client
      .from("favorites")
      .select("*")
      .eq("user_id", user?.id as string)
      .single()

    const update = await handleFavorites({ currentData, id, type, action })

    const { data, error, statusText } = await client
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
