import { concat, take } from "lodash"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getFavorites } from "@/queries/favorites"
import { getProfileData } from "@/queries/profiles"
import { getSpotifyData } from "@/queries/spotify"

import Profile from "./Profile"

export default async function IndexPage() {
  const supabase = createSupabaseServerClient()
  const profileData = await getProfileData(supabase)
  const favoritesData = await getFavorites(supabase)
  const spotifyData = await getSpotifyData(supabase, 3)

  if (profileData.status === "error") {
    console.log(profileData.message)
    return
  }

  if (favoritesData.status === "error") {
    console.log(favoritesData.message)
    return
  }

  if (spotifyData.status === "error") {
    return <div>Spotify token expired. Please relink your Spotify account in your profile</div>
  }

  return (
    <div className="flex flex-row">
      <Profile
        profileData={profileData.data}
        spotifyData={{
          type: "tracks",
          items: take(
            concat(
              favoritesData.data.items,
              spotifyData.data.items.filter(
                ({ id }) => !favoritesData.data.items.some((favorite: any) => favorite.id === id)
              )
            ),
            3
          ),
        }}
      />
    </div>
  )
}
