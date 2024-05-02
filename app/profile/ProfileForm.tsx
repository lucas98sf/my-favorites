"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link1Icon, UpdateIcon } from "@radix-ui/react-icons"
import { FC, useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { signInWithSpotify } from "@/app/login/action"
import { ErrorAlert } from "@/components/ErrorAlert"
import { SuccessAlert } from "@/components/SuccessAlert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import useSupabaseBrowser from "@/lib/supabase/browser"
import { cn } from "@/lib/utils"
import { updateUserProfile } from "@/server/profiles"
import { Database } from "@/supabase/database.types"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

const profileSchema = z.object({
  username: z.string().min(3).optional(),
  full_name: z.string().min(3).optional(),
  mal_username: z.string().min(3).optional(),
  letterboxd_username: z.string().min(3).optional(),
  backloggd_username: z.string().min(3).optional(),
})

interface ProfileFormProps {
  user: z.infer<typeof profileSchema> & { email: string; id: string; avatar_url: string }
  spotifyLinked: boolean
}

const ProfileForm: FC<ProfileFormProps> = ({ spotifyLinked, user }) => {
  const supabase = useSupabaseBrowser()
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user.avatar_url)

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    disabled: updating,
    defaultValues: {
      username: user.username,
      full_name: user.full_name,
      mal_username: user.mal_username,
      letterboxd_username: user.letterboxd_username,
      backloggd_username: user.backloggd_username,
    },
    reValidateMode: "onBlur",
  })

  const linkSpotify = useCallback(async () => {
    setUpdating(true)

    await signInWithSpotify()

    setUpdating(false)
  }, [])

  const uploadAvatar: React.ChangeEventHandler<HTMLInputElement> = async event => {
    try {
      setUpdating(true)
      setError(null)
      setSuccess(null)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.")
      }

      const file = event.target.files[0]
      const filePath = `${user?.id}/${file.name}`

      const { data, error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
        upsert: true,
      })

      if (uploadError) {
        throw uploadError
      }

      const url = supabase.storage.from("avatars").getPublicUrl(data?.path as string).data?.publicUrl

      await updateProfile({ avatar_url: url })

      setAvatarUrl(url)
    } catch (error) {
      setError("Error uploading avatar!")
    } finally {
      setUpdating(false)
    }
  }

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

  return (
    <Card className="m-auto py-8 p-6 max-h-[80vh]">
      {success && <SuccessAlert message={success} />}
      {error && <ErrorAlert message={error} />}
      <CardHeader>
        <Avatar className="rounded-sm size-32 m-auto">
          <AvatarImage src={avatarUrl} alt={user?.username ?? undefined} />
          <AvatarFallback>{(user?.full_name as string).split(" ").map(s => s[0].toUpperCase())}</AvatarFallback>
        </Avatar>
        <Label className="text-right" htmlFor="upload">
          {updating ? "Uploading ..." : "Upload avatar"}
        </Label>
        <Input
          id="upload"
          style={{
            visibility: "hidden",
            position: "absolute",
          }}
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={updating}
        />
        <label htmlFor="email">Email</label>
        <Input id="email" type="text" value={user?.email} disabled />
      </CardHeader>
      <Form {...profileForm}>
        <form key="login" onSubmit={profileForm.handleSubmit(updateProfile)}>
          <CardContent>
            <div className="flex flex-col gap-2 justify-around">
              <FormField
                control={profileForm.control}
                name="username"
                disabled={updating}
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
                disabled={updating}
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
                <div className="flex flex-row gap-1">
                  <Input
                    disabled
                    value={spotifyLinked ? "Linked" : "Not linked"}
                    className={cn("text-center", spotifyLinked ? "text-green-600" : "text-red-600")}
                  />
                  <Button
                    variant="outline"
                    //@todo: add unlink
                    onClick={linkSpotify}
                  >
                    {spotifyLinked ? <UpdateIcon className="w-4 h-4" /> : <Link1Icon className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <FormField
                control={profileForm.control}
                name="mal_username"
                disabled={updating}
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
                disabled={updating}
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
                disabled={updating}
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
            <Button
              className="mt-1"
              type="submit"
              disabled={updating || profileForm.formState.isSubmitting || !profileForm.formState.isDirty}
            >
              {updating ? "Updating..." : "Update"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
export default ProfileForm
