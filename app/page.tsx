import { concat, take } from "lodash"
import { redirect } from "next/navigation"

import { getFavorites } from "@/server/favorites"
import { getProfileData } from "@/server/profiles"
import { getSpotifyData } from "@/server/spotify"

import Profile from "./Profile"

export default async function IndexPage({ searchParams }: { searchParams: Record<string, string> }) {
  const code = searchParams["code"]

  if (code) {
    redirect(`/auth/callback?code=${code}`)
  }

  const profileData = await getProfileData()
  const favoritesData = await getFavorites()
  const spotifyData = await getSpotifyData()

  if (profileData.status === "error") {
    return
  }

  if (favoritesData.status === "error") {
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
            4
          ),
        }}
      />
    </div>
  )
}
