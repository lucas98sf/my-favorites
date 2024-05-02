import { concat, take } from "lodash"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getFavorites } from "@/server/favorites"
import { getProfileData } from "@/server/profiles"
import { getSpotifyData } from "@/server/spotify"

import Profile from "./Profile"

export default async function UsernamePage({ params }: { params: { username: string } }) {
  if (!params.username) {
    return
  }

  const client = createSupabaseServerClient()

  const { data, error } = await client.from("profiles").select("user_id").eq("username", params.username).single()
  if (error || !data.user_id) {
    console.log(error, params.username)
    redirect("/404")
  }

  const profileData = await getProfileData(data.user_id)
  const spotifyData = await getSpotifyData(data.user_id)
  const favoriteTracksData = await getFavorites(data.user_id, "tracks")
  const favoriteMoviesData = await getFavorites(data.user_id, "movies")
  const favoriteAnimesData = await getFavorites(data.user_id, "animes")

  if (profileData.status === "error") {
    console.error(profileData.message)
    return
  }

  if (spotifyData.status === "error") {
    console.error(spotifyData.message)
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

  return (
    <div className="flex flex-row">
      <Profile
        profileData={profileData.data}
        spotifyData={{
          type: "tracks",
          items: take(
            concat(
              favoriteTracksData.data.items,
              spotifyData.data.items.filter(
                ({ id }) => !favoriteTracksData.data.items.some((favorite: any) => favorite.id === id)
              )
            ),
            4
          ),
        }}
        moviesData={favoriteMoviesData.data}
        animesData={favoriteAnimesData.data}
      />
    </div>
  )
}
