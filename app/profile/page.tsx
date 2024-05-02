import { concat, take } from "lodash"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { FavoriteItem, getFavorites } from "@/server/favorites"
import { getLetterboxdFavorites } from "@/server/letterboxd"
import { getTopRatedAnimes, getUserTopRatedAnimes } from "@/server/myanimelist"
import { getUserProfile } from "@/server/profiles"
import { getSpotifyData } from "@/server/spotify"
import { getTopRatedMovies, searchMovies } from "@/server/tmdb"

import List from "./List"
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

  const spotifyData = await getSpotifyData(user.id, 50)

  const favoriteMoviesData = await getFavorites(user.id, "movies")
  const favoriteTracksData = await getFavorites(user.id, "tracks")
  const favoriteAnimesData = await getFavorites(user.id, "animes")

  const letterboxdData = await getLetterboxdFavorites(profileData.data.letterboxd_username as string)
  let letterboxdFavorites: FavoriteItem[] = []
  if (letterboxdData.status === "success") {
    letterboxdFavorites = (await Promise.all(letterboxdData.data?.map(item => searchMovies(item.slug)) ?? [])).flatMap(
      movie => (movie.status === "success" ? [movie.data.items[0]] : [])
    )
  }
  const moviesData = await getTopRatedMovies({ excludeIds: letterboxdFavorites.map(({ id }) => id) })
  if (moviesData.status === "success" && letterboxdFavorites.length > 0) {
    moviesData.data.items.unshift(...letterboxdFavorites)
  }

  const malFavorites = await getUserTopRatedAnimes(profileData.data.mal_username as string)
  const animesData = await getTopRatedAnimes({
    excludeIds: favoriteAnimesData.status === "success" ? favoriteAnimesData.data.items.map(({ id }) => id) : [],
  })
  if (malFavorites.status === "success" && animesData.status === "success") {
    animesData.data.items.unshift(...malFavorites.data.items)
  }

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
          userId={user.id}
          data={{
            type: "tracks",
            items: take(
              concat(
                favoriteTracksData.status === "success" ? favoriteTracksData.data.items : [],
                favoriteTracksData.status === "success"
                  ? spotifyData.data.items.filter(
                      ({ id }) => !favoriteTracksData.data.items.some((favorite: any) => favorite.id === id)
                    )
                  : spotifyData.data.items
              ),
              50
            ),
          }}
          favorites={favoriteTracksData.status === "success" ? favoriteTracksData.data.items.map(({ id }) => id) : []}
        />
      )}
      {moviesData?.status === "success" && (
        <List
          userId={user.id}
          data={{
            type: "movies",
            items: take(
              concat(
                favoriteMoviesData.status === "success" ? favoriteMoviesData.data.items : [],
                favoriteMoviesData.status === "success"
                  ? moviesData.data.items.filter(
                      ({ id }) => !favoriteMoviesData.data.items.some((favorite: any) => favorite.id === id)
                    )
                  : moviesData.data.items
              ),
              50
            ),
          }}
          favorites={favoriteMoviesData.status === "success" ? favoriteMoviesData.data.items.map(({ id }) => id) : []}
        />
      )}
      {animesData?.status === "success" && (
        <List
          userId={user.id}
          data={{
            type: "animes",
            items: take(
              concat(
                favoriteAnimesData.status === "success" ? favoriteAnimesData.data.items : [],
                favoriteAnimesData.status === "success"
                  ? animesData.data.items.filter(
                      ({ id }) => !favoriteAnimesData.data.items.some((favorite: any) => favorite.id === id)
                    )
                  : animesData.data.items
              ),
              50
            ),
          }}
          favorites={favoriteAnimesData.status === "success" ? favoriteAnimesData.data.items.map(({ id }) => id) : []}
        />
      )}
    </div>
  )
}
