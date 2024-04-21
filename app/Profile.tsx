"use client"
import { User } from "@supabase/supabase-js"
import { concat, take } from "lodash"
import { redirect, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { getFavorites, getSpotifyData, getUserData } from "@/app/action"
import { ErrorAlert } from "@/components/ErrorAlert"
import { SuccessAlert } from "@/components/SuccessAlert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export default function Profile() {
  const params = useSearchParams()
  const code = params.get("code")

  if (code) {
    redirect(`/auth/callback?code=${code}`)
  }

  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<any | null>(null)
  const [spotifyData, setSpotifyData] = useState<any | null>(null)

  const [user, setUser] = useState<User | null>(null)

  const getUser = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUser(user)

    setLoading(false)
  }, [supabase])

  const getProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const profileData = await getUserData()

    if (profileData.status === "error") {
      setError(profileData.message)
    }

    if (profileData.status === "success") {
      setProfileData(profileData.data)
    }

    const favoritesData = await getFavorites()
    const spotifyData = await getSpotifyData(3)

    if (favoritesData.status === "error") {
      setError(favoritesData.message)
      return
    }

    if (spotifyData.status === "error") {
      setError(spotifyData.message)
      return
    }

    setSpotifyData({
      type: "tracks",
      items: take(
        concat(
          favoritesData.data.items,
          spotifyData.data.items.filter(
            ({ id }) => !favoritesData.data.items.some((favorite: any) => favorite.id === id)
          )
        ),
        3
      ),
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!user) {
      getUser()
    } else {
      getProfile()
    }
  }, [user, getProfile, getUser])

  return loading
    ? "Loading..."
    : profileData && (
        <Card className="m-auto py-10 p-8 mx-24">
          {success && <SuccessAlert message={success} />}
          {error && <ErrorAlert message={error} />}
          <div className="flex flex-row justify-around gap-4">
            <Avatar>
              <AvatarImage src={profileData.avatar_url} alt={profileData.username ?? undefined} />
              <AvatarFallback>
                {(profileData.full_name as string).split(" ").map(s => s[0].toUpperCase())}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold">{profileData.username}</h1>
              <span className="mb-6">{profileData.full_name}</span>
              <div className="tracks flex flex-col gap-2">
                <span>Favorite track&apos;s</span>
                {spotifyData?.items?.map((track: any, index: number) => (
                  <iframe
                    key={index}
                    src={`https://open.spotify.com/embed/track/${track.id}`}
                    style={{
                      borderRadius: "14px",
                    }}
                    width="600"
                    height="152"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>
      )
}
