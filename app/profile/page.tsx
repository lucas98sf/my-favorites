import { concat, take } from "lodash"

import List from "@/components/List"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getFavorites } from "@/queries/favorites"
import { getLetterboxdFavorites } from "@/queries/letterboxd"
import { getUserProfile } from "@/queries/profiles"
import { getSpotifyData } from "@/queries/spotify"
import { getTopRatedMovies } from "@/queries/tmdb"

import ProfileForm from "./ProfileForm"

export default async function LoginPage() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  const profileData = await getUserProfile(supabase, user?.id as string)
  if (profileData.status === "error") {
    return
  }

  const favoritesData = await getFavorites()
  const spotifyData = await getSpotifyData(50)
  // const letterboxdData = await getLetterboxdFavorites(profileData.data.letterboxd_username as string)
  const moviesData = await getTopRatedMovies()

  return (
    <div className="flex flex-row gap-6">
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
          avatar_url: profileData.data.avatar_url as string,
        }}
      />
      {spotifyData.status === "success" && (
        <List
          data={{
            type: "tracks",
            items: take(
              concat(
                favoritesData.status === "success" ? favoritesData.data.items : [],
                favoritesData.status === "success"
                  ? spotifyData.data.items.filter(
                      ({ id }) => !favoritesData.data.items.some((favorite: any) => favorite.id === id)
                    )
                  : spotifyData.data.items
              ),
              50
            ),
          }}
          favorites={favoritesData.status === "success" ? favoritesData.data.items.map(({ id }) => id) : []}
        />
      )}
      {moviesData?.status === "success" && <></>}
    </div>
  )
}
