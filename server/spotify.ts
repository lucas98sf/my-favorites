"use server"
import SpotifyWebApi from "spotify-web-api-node"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"
import { Data, FavoriteItem } from "@/server/favorites"

const spotifyClient = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
})

export async function getSpotifyToken(userId: string | null = null): Promise<
  Result<{
    access_token: string
    refresh_token: string | null
    expires_at: number
  }>
> {
  try {
    const client = createSupabaseServerClient()

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
        const data = await spotifyClient.clientCredentialsGrant()

        return {
          status: "success",
          data: {
            access_token: data.body.access_token,
            refresh_token: null,
            expires_at: data.body.expires_in * 1000 + Date.now(),
          },
        }
      }

      return {
        status: "success",
        data: {
          access_token: data?.access_token as string,
          refresh_token: data?.refresh_token,
          expires_at: data?.expires_at as number,
        },
      }
    }

    const data = await spotifyClient.clientCredentialsGrant()

    return {
      status: "success",
      data: {
        access_token: data.body.access_token,
        refresh_token: null,
        expires_at: data.body.expires_in * 1000 + Date.now(),
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

export async function getSpotifyData(userId: string | null = null, limit = 4): Promise<Result<Data>> {
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
