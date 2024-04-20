"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { User } from "@supabase/supabase-js"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { authSpotify, getUserProfile, updateUserProfile } from "@/app/profile/action"
import { ErrorAlert } from "@/components/ErrorAlert"
import { SuccessAlert } from "@/components/SuccessAlert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/supabase/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

const profileSchema = z.object({
  username: z.string().min(3).optional(),
  full_name: z.string().min(3).optional(),
  mal_username: z.string().min(3).optional(),
  letterboxd_username: z.string().min(3).optional(),
  backloggd_username: z.string().min(3).optional(),
})

export default function ProfileForm() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [user, setUser] = useState<User | null>(null)
  const [spotifyLinked, setSpotifyLinked] = useState<boolean>(false)

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    disabled: loading,
    reValidateMode: "onBlur",
  })

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

    if (result.status === "error") {
      setError(result.message)
    }

    if (result.status === "success") {
      profileForm.reset({
        username: result.data.username ?? undefined,
        full_name: result.data.full_name ?? undefined,
        mal_username: result.data.mal_username ?? undefined,
        letterboxd_username: result.data.letterboxd_username ?? undefined,
        backloggd_username: result.data.backloggd_username ?? undefined,
      })
      setSpotifyLinked(result.data.spotify_linked)
    }

    setLoading(false)
  }, [profileForm, user?.id])

  useEffect(() => {
    if (!user) {
      getUser()
    } else {
      getProfile()
    }
  }, [user, getProfile, getUser])

  const linkSpotify = useCallback(async () => {
    setLoading(true)

    await authSpotify()

    setLoading(false)
  }, [])

  const updateProfile = useCallback(
    async (data: Partial<Profile>) => {
      setUpdating(true)
      setError(null)
      setSuccess(null)

      const result = await updateUserProfile({ ...data, user_id: user?.id as string })
      if (result.status === "error") {
        if (result.code === "Conflict") {
          profileForm.setError("username", {
            message: result.message,
            type: "manual",
          })
        } else {
          setError(result.message)
        }
      }
      setUpdating(false)
    },
    [profileForm, user?.id]
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
      <Form {...profileForm}>
        <form key="login" onSubmit={profileForm.handleSubmit(updateProfile)}>
          <CardContent>
            <div className="flex flex-col gap-4 justify-around">
              <FormField
                control={profileForm.control}
                name="username"
                disabled={loading}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input type="text" autoComplete="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="full_name"
                disabled={loading}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input type="text" autoComplete="given-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col">
                <label>Spotify</label>
                <Button
                  variant="outline"
                  className={spotifyLinked ? "text-green-600" : "text-red-600"}
                  //@todo: add unlink
                  onClick={linkSpotify}
                >
                  {spotifyLinked ? "Linked" : "Not linked"}
                </Button>
              </div>
              <FormField
                control={profileForm.control}
                name="mal_username"
                disabled={loading}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>My Anime List username</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="letterboxd_username"
                disabled={loading}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Letterboxd username</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="backloggd_username"
                disabled={loading}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Backloggd username</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="mt-5" type="submit" disabled={updating || !profileForm.formState.isDirty}>
              {updating ? "Updating..." : "Update"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
