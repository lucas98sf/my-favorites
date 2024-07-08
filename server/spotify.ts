"use server"

import ky from "ky"
import { cookies } from "next/headers"
import { cache } from "react"
import SpotifyWebApi from "spotify-web-api-node"

import { MAX_FAVORITES } from "@/lib/constants"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"
import { Data, FavoriteItem } from "@/server/favorites"

const spotifyClient = cache(
  () =>
    new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    })
)

type SpotifyToken = {
  access_token: string
  refresh_token: string | null
  expires_at: number
}

export const getSpotifyToken = cache(async (userId: string | null = null): Promise<Result<SpotifyToken>> => {
  try {
    const cookieStore = cookies()
    const client = createSupabaseServerClient(cookieStore)
    let result: Result<SpotifyToken> | null = null

    if (userId) {
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

        return result
      }

      if (error) {
        const data = await spotifyClient().clientCredentialsGrant()

        result = {
          status: "success",
          data: {
            access_token: data.body.access_token,
            refresh_token: null,
            expires_at: data.body.expires_in * 1000 + Date.now(),
          },
        }

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

        return result
      }
    }

    const data = await spotifyClient().clientCredentialsGrant()

    result = {
      status: "success",
      data: {
        access_token: data.body.access_token,
        refresh_token: null,
        expires_at: data.body.expires_in * 1000 + Date.now(),
      },
    }

    return result
  } catch (error: any) {
    console.error(error.message)
    return {
      status: "error",
      message: "There was an error getting your spotify token",
    }
  }
})

export const getUserSpotifyData = cache(
  async (userId: string | null = null, limit = MAX_FAVORITES): Promise<Result<Data>> => {
    try {
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

      return result
    } catch (error: any) {
      console.error(error.message)
      return {
        status: "success",
        data: {
          type: "tracks",
          items: [],
        },
      }
    }
  }
)

export const getTopTracks = cache(async (): Promise<Result<Data>> => {
  try {
    const spotifyToken = await getSpotifyToken()

    if (spotifyToken.status === "error") {
      return {
        status: "error",
        message: "There was an error getting your spotify token",
      }
    }

    const result: Result<Data> = await ky
      .get("https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF", {
        headers: {
          Authorization: `Bearer ${spotifyToken.data.access_token}`,
        },
      })
      .json<any>()
      .then(data => {
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

    return result
  } catch (error: any) {
    console.error(error.message)
    return {
      status: "error",
      message: "Could not find Spotify data",
    }
  }
})

export async function getUserTopTracks({
  spotifyToken,
  limit,
}: {
  spotifyToken: string
  limit: number
}): Promise<Result<Data>> {
  try {
    return ky
      .get(`https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      })
      .json<any>()
      .then(data => {
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
  } catch (error: any) {
    console.error(error.message)
    return {
      status: "error",
      message: "Could not find Spotify data",
    }
  }
}

export const getTrackById = cache(
  async ({ spotifyToken, id }: { spotifyToken: string; id: string }): Promise<Result<FavoriteItem>> => {
    try {
      return ky
        .get(`https://api.spotify.com/v1/tracks/${id}`, {
          headers: {
            Authorization: `Bearer ${spotifyToken}`,
          },
        })
        .json<any>()
        .then(
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
    } catch (error: any) {
      console.error(error.message)
      return {
        status: "error",
        message: "Could not find Spotify data",
      }
    }
  }
)

export const searchTrack = async ({
  spotifyToken,
  search,
  limit = 1,
}: {
  spotifyToken: string
  search: string
  limit?: number
}): Promise<Result<Data>> => {
  try {
    return ky
      .get(`https://api.spotify.com/v1/search?query=${encodeURI(search)}&type=track&offset=0&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      })
      .json<any>()
      .then(data => {
        return {
          status: "success",
          data: {
            type: "tracks",
            items:
              data.tracks?.items?.map((item: any) => ({
                id: item.id,
                title: item.name,
                description: item.artists?.[0]?.name,
                image: item.album?.images?.[0]?.url,
              })) ?? [],
          },
        } as Result<Data>
      })
  } catch (error: any) {
    console.error(error.message)
    return {
      status: "error",
      message: "Could not find Spotify data",
    }
  }
}
