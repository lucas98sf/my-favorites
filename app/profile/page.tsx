import { getUserProfile } from "@/app/profile/action"
import { createClient } from "@/lib/supabase/server"

import ProfileForm from "./ProfileForm"

export default async function LoginPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  const profileData = await getUserProfile(user?.id)
  if (profileData.status === "error") {
    return
  }

  return (
    <ProfileForm
      spotifyLinked={profileData.data.spotify_linked}
      user={{
        id: user.id,
        email: user.email as string,
        backloggd_username: profileData.data.backloggd_username ?? undefined,
        full_name: profileData.data.full_name ?? undefined,
        letterboxd_username: profileData.data.letterboxd_username ?? undefined,
        mal_username: profileData.data.mal_username ?? undefined,
        username: profileData.data.username ?? undefined,
      }}
    />
  )
}
