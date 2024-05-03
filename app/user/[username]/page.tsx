import { concat, take } from "lodash"
import { redirect } from "next/navigation"
import { generateSlug } from "random-word-slugs"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getFavorites } from "@/server/favorites"
import { getProfileData } from "@/server/profiles"
import { getUserSpotifyData } from "@/server/spotify"
import { Database } from "@/supabase/database.types"

import Profile from "./Profile"

export default async function UsernamePage({
  params,
  searchParams,
}: {
  params: { username: string }
  searchParams: Record<string, string>
}) {
  const client = createSupabaseServerClient()
  if (!params.username && !searchParams.id) {
    return
  }

  if (searchParams.id && !params.username) {
    const { data, error } = await client
      .from("profiles")
      .update({
        username: generateSlug(),
      })
      .eq("user_id", searchParams.id)
      .returns<Database["public"]["Tables"]["profiles"]["Row"]>()

    if (error) {
      console.error(error)
      return
    }

    redirect(`/user/${data.username}`)
  }

  const { data, error } = await client.from("profiles").select("user_id").eq("username", params.username).single()
  if (error || !data.user_id) {
    console.log(error, params.username)
    redirect("/404")
  }

  const profileData = await getProfileData(data.user_id)
  const spotifyData = await getUserSpotifyData(data.user_id)
  const favoriteTracksData = await getFavorites(data.user_id, "tracks")
  const favoriteMoviesData = await getFavorites(data.user_id, "movies")
  const favoriteAnimesData = await getFavorites(data.user_id, "animes")
  const favoriteGamesData = await getFavorites(data.user_id, "games")

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

  if (favoriteGamesData.status === "error") {
    console.error(favoriteGamesData.message)
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
        gamesData={favoriteGamesData.data}
      />
    </div>
  )
}
