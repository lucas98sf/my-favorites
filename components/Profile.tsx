import { User } from "@supabase/supabase-js"
import { useCallback, useEffect, useState } from "react"

import { ErrorAlert } from "@/components/ErrorAlert"
import { SuccessAlert } from "@/components/SuccessAlert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export default function ProfileForm() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [user, setUser] = useState<User | null>(null)

  //@todo: add form
  const [username, setUsername] = useState<string | null>(null)
  const [fullName, setFullName] = useState<string | null>(null)
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null)
  const [malUsername, setMalUsername] = useState<string | null>(null)
  const [letterboxdUsername, setLetterboxdUsername] = useState<string | null>(null)
  const [backloggdUsername, setBackloggdUsername] = useState<string | null>(null)
  // const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const getUser = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    setUser(user)

    if (!user) throw new Error("User not found")

    setLoading(false)
  }, [supabase])

  const getProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const { data, error, status } = await supabase
        .from("profiles")
        .select(`username, full_name, spotify_token, mal_username, letterboxd_username, backloggd_username`)
        .eq("user_id", user?.id)
        .single()

      if (error && status !== 406) {
        console.log(error)
        throw error
      }

      if (data) {
        setUsername(data.username)
        setFullName(data.full_name)
        setSpotifyToken(data.spotify_token)
        setMalUsername(data.mal_username)
        setLetterboxdUsername(data.letterboxd_username)
        setBackloggdUsername(data.backloggd_username)
      }
    } catch (error: any) {
      setError(error.message)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [supabase, user?.id])

  useEffect(() => {
    if (!user) {
      getUser()
    } else {
      getProfile()
    }
  }, [user, getProfile, getUser])

  async function updateProfile({
    username,
    fullName,
    spotifyToken,
    malUsername,
    letterboxdUsername,
    backloggdUsername,
  }: {
    username: string | null
    fullName: string | null
    spotifyToken: string | null
    malUsername: string | null
    letterboxdUsername: string | null
    backloggdUsername: string | null
  }) {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: user?.id as string,
          username,
          full_name: fullName,
          spotify_token: spotifyToken,
          mal_username: malUsername,
          letterboxd_username: letterboxdUsername,
          backloggd_username: backloggdUsername,
        },
        {
          onConflict: "user_id",
        }
      )
      if (error) throw error
      setSuccess("Profile updated successfully!")
    } catch (error: any) {
      setError(error.message)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return user ? (
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
            <Input id="username" type="text" value={username || ""} onChange={e => setUsername(e.target.value)} />
          </div>
          <div>
            <label htmlFor="fullName">Full Name</label>
            <Input id="fullName" type="text" value={fullName || ""} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="spotifyToken">Spotify Token</label>
            <Input
              id="spotifyToken"
              type="url"
              value={spotifyToken || ""}
              onChange={e => setSpotifyToken(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="malUsername">My Anime List Username</label>
            <Input
              id="malUsername"
              type="url"
              value={malUsername || ""}
              onChange={e => setMalUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="letterboxdUsername">Letterboxd Username</label>
            <Input
              id="letterboxdUsername"
              type="url"
              value={letterboxdUsername || ""}
              onChange={e => setLetterboxdUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="backloggdUsername">Backloggd Username</label>
            <Input
              id="backloggdUsername"
              type="url"
              value={backloggdUsername || ""}
              onChange={e => setBackloggdUsername(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="mt-5"
          onClick={() =>
            updateProfile({ username, fullName, backloggdUsername, letterboxdUsername, malUsername, spotifyToken })
          }
          disabled={loading}
        >
          {loading ? "Loading..." : "Update"}
        </Button>
      </CardFooter>
    </Card>
  ) : (
    <div>Loading...</div>
  )
}
