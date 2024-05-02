"use server"
import { filter, takeRight } from "lodash"
import PQueue from "p-queue"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"
import { getAnimeById } from "@/server/myanimelist"
import { getSpotifyToken, getTrackById } from "@/server/spotify"
import { getMovieById } from "@/server/tmdb"
import { Database } from "@/supabase/database.types"

export type Favorites = Database["public"]["Tables"]["favorites"]["Row"]

export type FavoriteType = "tracks" | "movies" | "games" | "animes"

export type FavoriteItem = {
  id: string
  title: string
  description?: string
  image: string
  rating?: number
}

export type Data = {
  type: FavoriteType
  items: FavoriteItem[]
}

export async function getFavorites(userId: string, type: FavoriteType): Promise<Result<Data>> {
  try {
    const client = createSupabaseServerClient()

    const { data, error, statusText } = await client.from("favorites").select("*").eq("user_id", userId).single()

    if (error) {
      if (error.code === "PGRST116") {
        return {
          status: "success",
          data: {
            type,
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

    if (type === "tracks") {
      const spotifyToken = await getSpotifyToken(userId)

      if (spotifyToken.status === "error") {
        return {
          status: "error",
          message: spotifyToken.message,
        }
      }
      const favoriteTracks = await Promise.all(
        data.tracks?.map((id: string) => getTrackById({ id, spotifyToken: spotifyToken.data?.access_token as string }))
      )
      return {
        status: "success",
        data: {
          type: "tracks",
          items: favoriteTracks.flatMap(track => (track.status === "success" ? [track.data] : [])),
        },
      }
    }
    if (type === "movies") {
      const favoriteMovies = await Promise.all(data.movies?.map((id: string) => getMovieById(id)))
      return {
        status: "success",
        data: {
          type: "movies",
          items: favoriteMovies.flatMap(movie => (movie.status === "success" ? [movie.data] : [])),
        },
      }
    }
    if (type === "animes") {
      const queue = new PQueue({ concurrency: 1, interval: 250 })
      const favoriteAnimes = await queue.addAll(data.animes?.map((id: string) => () => getAnimeById(id)))
      return {
        status: "success",
        data: {
          type: "animes",
          items: favoriteAnimes.flatMap(anime => (anime.status === "success" ? [anime.data] : [])),
        },
      }
    }
    if (type === "games") {
      return {
        status: "success",
        data: {
          type: "games",
          items: [],
        },
      }
    }
    return {
      status: "error",
      message: "Could not find favorites",
    }
  } catch (error) {
    console.error(error)
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
    ? { [type]: filter(currentData?.[type] ?? [], currentDataId => currentDataId != id) }
    : { [type]: takeRight([...new Set([...(currentData?.[type] ?? []), id])], 4) }
}

export async function favoriteItem({
  id,
  userId,
  type,
  action = "add",
}: {
  userId: string
  id: string
  type: FavoriteType
  action: "add" | "remove"
}): Promise<Result<Favorites["tracks"]>> {
  try {
    const client = createSupabaseServerClient()

    const { data: currentData } = await client.from("favorites").select("*").eq("user_id", userId).single()

    const update = await handleFavorites({ currentData, id, type, action })

    const { data, error, statusText } = await client
      .from("favorites")
      .upsert(
        {
          user_id: userId,
          ...update,
        },
        { onConflict: "user_id" }
      )
      .select(type)
      .single()

    if (error) {
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
