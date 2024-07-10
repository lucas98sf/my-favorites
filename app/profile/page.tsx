import { concat, take } from "lodash"
import { cookies } from "next/headers"

import { MAX_PROFILE_ITEMS } from "@/lib/constants"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getPopularGames } from "@/server/backloggd"
import { getFavorites } from "@/server/favorites"
import { getLetterboxdFavorites } from "@/server/letterboxd"
import { getTopRatedAnimes, getUserTopRatedAnimes } from "@/server/myanimelist"
import { getUserProfile } from "@/server/profiles"
import { getTopTracks, getUserSpotifyData } from "@/server/spotify"
import { getUserTopSteamGames } from "@/server/steam"
import { getTopRatedMovies } from "@/server/tmdb"

import List from "./List"
import ProfileForm from "./ProfileForm"

export default async function ProfilePage() {
  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(cookieStore)

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

  let spotifyData = await getUserSpotifyData(user.id, MAX_PROFILE_ITEMS)
  if (spotifyData.status === "success" && spotifyData.data.items.length === 0) {
    spotifyData = await getTopTracks()
  }

  const [
    favoriteTracksData,
    favoriteMoviesData,
    letterboxdFavorites,
    moviesData,
    favoriteAnimesData,
    malFavorites,
    animesData,
    favoriteGamesData,
    steamFavorites,
    gamesData,
  ] = await Promise.all([
    getFavorites(user.id, "tracks"),
    getFavorites(user.id, "movies"),
    getLetterboxdFavorites(profileData.data.letterboxd_username as string),
    getTopRatedMovies(),
    getFavorites(user.id, "animes"),
    getUserTopRatedAnimes(profileData.data.mal_username as string),
    getTopRatedAnimes(),
    getFavorites(user.id, "games"),
    getUserTopSteamGames(profileData.data.steam_id as string),
    getPopularGames(),
  ])

  if (moviesData.status === "success" && letterboxdFavorites.status === "success") {
    moviesData.data.items
      .filter(movies => !letterboxdFavorites.data.items?.some(({ id }) => id === movies.id))
      .unshift(...letterboxdFavorites.data.items)
  }

  if (malFavorites.status === "success" && animesData.status === "success") {
    animesData.data.items
      .filter(animes => !malFavorites.data.items?.some(({ id }) => id === animes.id))
      .unshift(...malFavorites.data.items)
  }

  if (steamFavorites.status === "success" && gamesData.status === "success") {
    gamesData.data.items
      .filter(games => !steamFavorites.data.items?.some(({ id }) => id === games.id))
      .unshift(...steamFavorites.data.items)
  }

  return (
    <div className="flex flex-col xl:flex-row gap-6">
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
              MAX_PROFILE_ITEMS
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
              MAX_PROFILE_ITEMS
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
              MAX_PROFILE_ITEMS
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
              MAX_PROFILE_ITEMS
            ),
          }}
          favorites={favoriteGamesData.status === "success" ? favoriteGamesData.data.items.map(({ id }) => id) : []}
        />
      )}
    </div>
  )
}
