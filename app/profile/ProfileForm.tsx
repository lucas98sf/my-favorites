"use client"
import { User } from "@supabase/supabase-js"
import { useCallback, useEffect, useState } from "react"

import { authSpotify, getUserProfile, getUserSpotifyAccessToken, updateUserProfile } from "@/app/profile/action"
import { ErrorAlert } from "@/components/ErrorAlert"
import { SuccessAlert } from "@/components/SuccessAlert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/supabase/database.types"

type Profile = Database["public"]["Views"]["profiles_view"]["Row"]
type SpotifyAccessToken = Database["public"]["Views"]["user_spotify_token_view"]["Row"]

export default function ProfileForm() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [user, setUser] = useState<User | null>(null)

  //@todo: add form
  const [profileData, setProfileData] = useState<Partial<Profile> | null>(null)
  const [spotifyToken, setSpotifyToken] = useState<SpotifyAccessToken | null>(null)
  // const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const getUser = useCallback(async () => {
    setError(null)
    setSuccess(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUser(user)
  }, [supabase])

  const getProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const result = await getUserProfile(user?.id as string)
    const resultSpotifyToken = await getUserSpotifyAccessToken()
    console.log({ resultSpotifyToken })

    if (result.status === "error") {
      setError(result.message)
    }
    if (resultSpotifyToken.status === "error") {
      setError(resultSpotifyToken.message)
    }

    if (result.status === "success") {
      setProfileData(result.data)
    }

    if (resultSpotifyToken.status === "success") {
      setSpotifyToken(resultSpotifyToken.data as any)
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    if (!user) {
      getUser()
    } else {
      getProfile()
    }
  }, [user, getProfile, getUser])

  const bla = useCallback(async () => {
    setLoading(true)

    await authSpotify()

    setLoading(false)
  }, [])

  const updateProfile = useCallback(
    async (data: Partial<Profile>) => {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const result = await updateUserProfile({ ...data, user_id: user?.id as string })
      if (result.status === "error") {
        setError(result.message)
      }

      setLoading(false)
    },
    [user?.id]
  )

  return loading ? (
    <div>Loading...</div>
  ) : (
    <Card className="m-auto py-10 p-8">
      {success && <SuccessAlert message={success} />}
      {error && <ErrorAlert message={error} />}
      <CardHeader>
        <label htmlFor="email">Email</label>
        <Input id="email" type="text" value={user?.email} disabled />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 justify-around">
          <div>
            <label htmlFor="username">Username</label>
            <Input
              id="username"
              type="text"
              value={profileData?.username || ""}
              onChange={e => setProfileData({ ...profileData, username: e.target.value as string })}
            />
          </div>
          <div>
            <label htmlFor="fullName">Full Name</label>
            <Input
              id="fullName"
              type="text"
              value={profileData?.full_name || ""}
              onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <label>Spotify</label>
            <Button
              variant="outline"
              className={profileData?.spotify_linked ? "text-green-600" : "text-red-600"}
              //@todo: add unlink
              onClick={_ => bla()}
              // disabled={loading || !!profileData?.spotify_linked}
            >
              {profileData?.spotify_linked ? "Linked" : "Not linked"}
            </Button>
          </div>
          <div>
            <label htmlFor="malUsername">My Anime List Username</label>
            <Input
              id="malUsername"
              type="url"
              value={profileData?.mal_username || ""}
              onChange={e => setProfileData({ ...profileData, mal_username: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="letterboxdUsername">Letterboxd Username</label>
            <Input
              id="letterboxdUsername"
              type="url"
              value={profileData?.letterboxd_username || ""}
              onChange={e => setProfileData({ ...profileData, letterboxd_username: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="backloggdUsername">Backloggd Username</label>
            <Input
              id="backloggdUsername"
              type="url"
              value={profileData?.backloggd_username || ""}
              onChange={e => setProfileData({ ...profileData, backloggd_username: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="mt-5" onClick={() => updateProfile(profileData as Partial<Profile>)} disabled={loading}>
          {loading ? "Loading..." : "Update"}
        </Button>
      </CardFooter>
    </Card>
  )
}
