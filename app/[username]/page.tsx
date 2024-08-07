import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getFavorites } from "@/server/favorites"
import { getProfileData } from "@/server/profiles"

import Profile from "./Profile"

export default async function UsernamePage({ params }: { params: { username: string } }) {
  const cookieStore = cookies()
  const client = createSupabaseServerClient(cookieStore)
  if (!params.username) {
    return
  }

  const { data, error } = await client.from("profiles").select("user_id").eq("username", params.username).single()
  if (error || !data.user_id) {
    console.log(error, params.username)
    redirect("/404")
  }

  const [profileData, favoriteTracksData, favoriteMoviesData, favoriteAnimesData, favoriteGamesData] =
    await Promise.all([
      getProfileData(data.user_id),
      getFavorites(data.user_id, "tracks"),
      getFavorites(data.user_id, "movies"),
      getFavorites(data.user_id, "animes"),
      getFavorites(data.user_id, "games"),
    ])

  if (profileData.status === "error") {
    console.error(profileData.message)
    return
  }

  if (favoriteTracksData.status === "error") {
    console.error(favoriteTracksData.message)
    return
  }

  if (favoriteMoviesData.status === "error") {
    console.error(favoriteMoviesData.message)
    return
  }

  if (favoriteAnimesData.status === "error") {
    console.error(favoriteAnimesData.message)
    return
  }

  if (favoriteGamesData.status === "error") {
    console.error(favoriteGamesData.message)
    return
  }

  return (
    <div className="flex flex-row">
      <Profile
        profileData={profileData.data}
        tracksData={favoriteTracksData.data}
        moviesData={favoriteMoviesData.data}
        animesData={favoriteAnimesData.data}
        gamesData={favoriteGamesData.data}
      />
    </div>
  )
}
