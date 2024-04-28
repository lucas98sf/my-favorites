import { concat, take } from "lodash"

import List from "@/components/List"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { FavoriteItem, getFavorites } from "@/server/favorites"
import { getLetterboxdFavorites } from "@/server/letterboxd"
import { getUserProfile } from "@/server/profiles"
import { getSpotifyData } from "@/server/spotify"
import { getTopRatedMovies, searchMovie } from "@/server/tmdb"

import ProfileForm from "./ProfileForm"

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return
  }

  const profileData = await getUserProfile(user?.id as string)
  if (profileData.status === "error") {
    return
  }

  const favoritesMoviesData = await getFavorites("movies")
  const favoritesTracksData = await getFavorites("tracks")

  const letterboxdData = await getLetterboxdFavorites(profileData.data.letterboxd_username as string)
  let letterboxdFavorites: FavoriteItem[] = []
  if (letterboxdData.status === "success") {
    letterboxdFavorites = (await Promise.all(letterboxdData.data?.map(item => searchMovie(item.slug)) ?? [])).flatMap(
      movie => (movie.status === "success" ? [movie.data.items[0]] : [])
    )
  }

  const moviesData = await getTopRatedMovies({ excludeIds: letterboxdFavorites.map(({ id }) => id) })
  if (moviesData.status === "success" && letterboxdFavorites.length > 0) {
    moviesData.data.items.unshift(...letterboxdFavorites)
  }

  const spotifyData = await getSpotifyData(50)

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
                favoritesTracksData.status === "success" ? favoritesTracksData.data.items : [],
                favoritesTracksData.status === "success"
                  ? spotifyData.data.items.filter(
                      ({ id }) => !favoritesTracksData.data.items.some((favorite: any) => favorite.id === id)
                    )
                  : spotifyData.data.items
              ),
              50
            ),
          }}
          favorites={favoritesTracksData.status === "success" ? favoritesTracksData.data.items.map(({ id }) => id) : []}
        />
      )}
      {moviesData?.status === "success" && (
        <List
          data={{
            type: "movies",
            items: take(
              concat(
                favoritesMoviesData.status === "success" ? favoritesMoviesData.data.items : [],
                favoritesMoviesData.status === "success"
                  ? moviesData.data.items.filter(
                      ({ id }) => !favoritesMoviesData.data.items.some((favorite: any) => favorite.id === id)
                    )
                  : moviesData.data.items
              ),
              50
            ),
          }}
          favorites={favoritesMoviesData.status === "success" ? favoritesMoviesData.data.items.map(({ id }) => id) : []}
        />
      )}
    </div>
  )
}
