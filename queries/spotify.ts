"use server"
import { redirect } from "next/navigation"

import { Result, SupabaseClient } from "@/lib/types"
import { Data } from "@/queries/favorites"

export async function getSpotifyToken(client: SupabaseClient): Promise<
  Result<{
    access_token: string | null
    refresh_token: string | null
    expires_at: number | null
  }>
> {
  const {
    data: { user },
  } = await client.auth.getUser()

  const { data, error, statusText } = await client
    .from("spotify_data")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", user?.id as string)
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

const getSpotifyApiData = async (spotifyToken: string, limit: number) => {
  return (await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${spotifyToken}`,
    },
  })
    .then(res =>
      res.json().then(data => {
        if (res.status === 401) {
          return {
            status: "error",
            message: "Unauthorized",
            code: "401",
          } as Result<any>
        }
        return {
          status: "success",
          data: data.items,
        } as Result<any>
      })
    )
    .catch(error => {
      console.error(error)
    })) as unknown as Promise<Result<any>>
}

export async function getSpotifyData(client: SupabaseClient, limit = 3): Promise<Result<Data>> {
  let redirectUrl: string | null = null

  try {
    const spotifyToken = await getSpotifyToken(client)

    if (spotifyToken.status === "error") {
      return {
        status: "error",
        message: "There was an error getting your spotify data",
      }
    }

    let spotifyApiData = await getSpotifyApiData(spotifyToken.data.access_token as string, limit)

    if (!spotifyApiData || (spotifyApiData.status === "error" && spotifyApiData.code === "401")) {
      const redirectTo = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/auth/callback/spotify`
      const { data, error } = await client.auth.signInWithOAuth({
        provider: "spotify",
        options: {
          redirectTo,
          scopes: "user-read-email user-read-private user-top-read",
          queryParams: {
            grant_type: "authorization_code",
          },
        },
      })

      if (error) {
        console.error(error)
        return {
          status: "error",
          message: "An error occurred",
        }
      }
      redirectUrl = data.url
    }

    if (spotifyApiData.status === "error") {
      console.error(spotifyApiData)
      return {
        status: "error",
        message: "There was an error fetching your spotify data",
      }
    }

    return {
      status: "success",
      data: {
        type: "tracks",
        items: spotifyApiData.data.map((data: any) => {
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
  } finally {
    if (redirectUrl) {
      console.log("!!!!!!!!!!")
      // redirect(redirectUrl)
    }
  }
}
