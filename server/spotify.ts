"use server"
import SpotifyWebApi from "spotify-web-api-node"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"
import { Data, FavoriteItem } from "@/server/favorites"

export async function getSpotifyToken(): Promise<
  Result<{
    access_token: string | null
    refresh_token: string | null
    expires_at: number | null
  }>
> {
  try {
    const client = createSupabaseServerClient()
    const {
      data: { user },
    } = await client.auth.getUser()

    const { data, error, statusText } = await client
      .from("spotify_data")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user?.id as string)
      .single()

    if (data?.expires_at && data.expires_at < Date.now()) {
      console.log("Refreshing token")

      const spotifyApi = new SpotifyWebApi({
        refreshToken: data.refresh_token as string,
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      })
      const newTokenData = await spotifyApi.refreshAccessToken()

      await client
        .from("spotify_data")
        .update({
          access_token: newTokenData?.body.access_token,
          expires_at: newTokenData?.body.expires_in * 1000 + Date.now(),
          refresh_token: newTokenData?.body.refresh_token,
        })
        .eq("user_id", user?.id as string)

      return {
        status: "success",
        data: {
          access_token: newTokenData?.body.access_token,
          expires_at: newTokenData?.body.expires_in * 1000 + Date.now(),
          refresh_token: newTokenData?.body.refresh_token as string,
        },
      }
    }

    if (error) {
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
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "There was an error getting your spotify token",
    }
  }
}

export async function getSpotifyData(limit = 4): Promise<Result<Data>> {
  try {
    const spotifyToken = await getSpotifyToken()

    if (spotifyToken.status === "error") {
      return {
        status: "error",
        message: "There was an error getting your spotify data",
      }
    }

    let spotifyApiData = await getTopTracks({ spotifyToken: spotifyToken.data.access_token as string, limit })

    if (spotifyApiData.status === "error") {
      return {
        status: "error",
        message: "There was an error fetching your spotify data",
      }
    }

    return {
      status: "success",
      data: spotifyApiData.data,
    }
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Could not find spotify data",
    }
  }
}

export async function getTopTracks({
  spotifyToken,
  limit,
}: {
  spotifyToken: string
  limit: number
}): Promise<Result<Data>> {
  return fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${spotifyToken}`,
    },
  })
    .then(res =>
      res.json().then(data => {
        if (res.status === 401) {
          throw new Error("Token expired")
        }
        return {
          status: "success",
          data: {
            type: "tracks",
            items: data.items.map((item: any) => ({
              id: item.id,
              title: item.name,
              description: item.artists?.[0]?.name,
              image: item.album?.images?.[0]?.url,
            })),
          },
        } as Result<Data>
      })
    )
    .catch(error => {
      console.error(error)
      return {
        status: "error",
        message: "Could not find spotify data",
      }
    })
}

export async function getTrackById({
  spotifyToken,
  id,
}: {
  spotifyToken: string
  id: string
}): Promise<Result<FavoriteItem>> {
  return fetch(`https://api.spotify.com/v1/tracks/${id}`, {
    headers: {
      Authorization: `Bearer ${spotifyToken}`,
    },
  })
    .then(res =>
      res.json().then(
        data =>
          ({
            status: "success",
            data: {
              id: data.id,
              title: data.name,
              description: data.artists?.[0]?.name,
              image: data.album?.images?.[0]?.url,
            },
          }) as Result<FavoriteItem>
      )
    )
    .catch(error => {
      console.error(error)
      return {
        status: "error",
        message: "Could not find spotify data",
      }
    })
}
