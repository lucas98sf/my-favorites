"use server"
import { kv } from "@vercel/kv"
import SpotifyWebApi from "spotify-web-api-node"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"
import { Data, FavoriteItem } from "@/server/favorites"

const spotifyClient = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
})

type SpotifyToken = {
  access_token: string
  refresh_token: string | null
  expires_at: number
}

export async function getSpotifyToken(userId: string | null = null): Promise<Result<SpotifyToken>> {
  try {
    const client = createSupabaseServerClient()
    let result: Result<SpotifyToken> | null = null

    if (userId) {
      const cached = await kv.get<Result<SpotifyToken>>(`spotifyToken-${userId}`)
      if (cached) {
        return cached
      }

      const { data, error } = await client
        .from("spotify_data")
        .select("access_token, refresh_token, expires_at")
        .eq("user_id", userId)
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
          .eq("user_id", userId)

        result = {
          status: "success",
          data: {
            access_token: newTokenData?.body.access_token,
            expires_at: newTokenData?.body.expires_in * 1000 + Date.now(),
            refresh_token: newTokenData?.body.refresh_token as string,
          },
        }

        kv.set(`spotifyToken-${userId}`, result)
        return result
      }

      if (error) {
        const data = await spotifyClient.clientCredentialsGrant()

        result = {
          status: "success",
          data: {
            access_token: data.body.access_token,
            refresh_token: null,
            expires_at: data.body.expires_in * 1000 + Date.now(),
          },
        }

        kv.set(`spotifyToken-${userId}`, result)
        return result
      }

      if (data?.access_token && data?.refresh_token && data?.expires_at) {
        result = {
          status: "success",
          data: {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at,
          },
        }

        kv.set(`spotifyToken-${userId}`, result)
        return result
      }
    }

    const cached = await kv.get<Result<SpotifyToken>>("spotifyToken")
    if (cached) {
      return cached
    }

    const data = await spotifyClient.clientCredentialsGrant()

    result = {
      status: "success",
      data: {
        access_token: data.body.access_token,
        refresh_token: null,
        expires_at: data.body.expires_in * 1000 + Date.now(),
      },
    }

    kv.set("spotifyToken", result)

    return result
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "There was an error getting your spotify token",
    }
  }
}

export async function getUserSpotifyData(userId: string | null = null, limit = 4): Promise<Result<Data>> {
  try {
    const cached = await kv.get<Result<Data>>(`spotifyData-${userId}-${limit}`)
    if (cached) {
      return cached
    }

    const spotifyToken = await getSpotifyToken(userId)

    if (spotifyToken.status === "error") {
      return {
        status: "error",
        message: "There was an error getting your spotify token",
      }
    }

    const spotifyApiData = await getUserTopTracks({ spotifyToken: spotifyToken.data.access_token as string, limit })

    if (spotifyApiData.status === "error") {
      return {
        status: "success",
        data: {
          type: "tracks",
          items: [],
        },
      }
    }

    const result: Result<Data> = {
      status: "success",
      data: spotifyApiData.data,
    }

    kv.set(`spotifyData-${userId}-${limit}`, result)

    return result
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Could not find spotify data",
    }
  }
}

export async function getTopTracks(): Promise<Result<Data>> {
  const cached = await kv.get<Result<Data>>("topTracks")
  if (cached) {
    return cached
  }

  const spotifyToken = await getSpotifyToken()

  if (spotifyToken.status === "error") {
    return {
      status: "error",
      message: "There was an error getting your spotify token",
    }
  }

  const result: Result<Data> = await fetch("https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF", {
    headers: {
      Authorization: `Bearer ${spotifyToken.data.access_token}`,
    },
  })
    .then(res =>
      res.json().then(data => {
        return {
          status: "success",
          data: {
            type: "tracks",
            items:
              data.tracks.items?.map(({ track }: any) => ({
                id: track.id,
                title: track.name,
                description: track.artists?.[0]?.name,
                image: track.album?.images?.[0]?.url,
              })) ?? [],
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

  kv.set("topTracks", result)

  return result
}

export async function getUserTopTracks({
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
        return {
          status: "success",
          data: {
            type: "tracks",
            items:
              data.items?.map((item: any) => ({
                id: item.id,
                title: item.name,
                description: item.artists?.[0]?.name,
                image: item.album?.images?.[0]?.url,
              })) ?? [],
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

export const searchTrack = async ({
  spotifyToken,
  search,
  limit = 1,
}: {
  spotifyToken: string
  search: string
  limit?: number
}): Promise<Result<Data>> => {
  return fetch(`https://api.spotify.com/v1/search?query=${search}&type=track&offset=0&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${spotifyToken}`,
    },
  })
    .then(res =>
      res.json().then(data => {
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
        message: "There was an error fetching your spotify data",
      }
    })
}
