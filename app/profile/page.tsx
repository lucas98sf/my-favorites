import { concat, take } from "lodash"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getPopularGames } from "@/server/backloggd"
import { FavoriteItem, getFavorites } from "@/server/favorites"
import { getLetterboxdFavorites } from "@/server/letterboxd"
import { getTopRatedAnimes, getUserTopRatedAnimes } from "@/server/myanimelist"
import { getUserProfile } from "@/server/profiles"
import { getTopTracks, getUserSpotifyData } from "@/server/spotify"
import { getUserTopSteamGames } from "@/server/steam"
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
    console.log(profileData.message)
    return
  }

  const favoriteTracksData = await getFavorites(user.id, "tracks")
  const favoriteMoviesData = await getFavorites(user.id, "movies")
  const favoriteAnimesData = await getFavorites(user.id, "animes")
  const favoriteGamesData = await getFavorites(user.id, "games")

  let spotifyData = await getUserSpotifyData(user.id, 50)
  if (spotifyData.status === "success" && spotifyData.data.items.length === 0) {
    spotifyData = await getTopTracks()
  }

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

  const steamFavorites = await getUserTopSteamGames(profileData.data.steam_id as string)
  const gamesData = await getPopularGames({
    excludeIds: favoriteGamesData.status === "success" ? favoriteGamesData.data.items.map(({ id }) => id) : [],
  })
  if (steamFavorites.status === "success" && gamesData.status === "success") {
    gamesData.data.items.unshift(...steamFavorites.data.items)
  }

  return (
    <div className="flex flex-row gap-6">
      <ProfileForm
        spotifyLinked={profileData.data.spotify_linked}
        user={{
          id: user.id,
          email: user.email as string,
          steam_id: profileData.data.steam_id ?? undefined,
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
              40
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
              40
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
              40
            ),
          }}
          favorites={favoriteAnimesData.status === "success" ? favoriteAnimesData.data.items.map(({ id }) => id) : []}
        />
      )}
      {gamesData?.status === "success" && (
        <List
          userId={user.id}
          data={{
            type: "games",
            items: take(
              concat(
                favoriteGamesData.status === "success" ? favoriteGamesData.data.items : [],
                favoriteGamesData.status === "success"
                  ? gamesData.data.items.filter(
                      ({ id }) => !favoriteGamesData.data.items.some((favorite: any) => favorite.id === id)
                    )
                  : gamesData.data.items
              ),
              40
            ),
          }}
          favorites={favoriteGamesData.status === "success" ? favoriteGamesData.data.items.map(({ id }) => id) : []}
        />
      )}
    </div>
  )
}
