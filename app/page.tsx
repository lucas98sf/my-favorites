import { concat, take } from "lodash"

import { getFavorites, getSpotifyData, getUserData } from "@/app/action"
import List from "@/app/List"

import Profile from "./Profile"

export default async function IndexPage() {
  const profileData = await getUserData()
  const favoritesData = await getFavorites()
  const spotifyData = await getSpotifyData(3)

  if (profileData.status === "error") {
    return
  }

  if (favoritesData.status === "error") {
    return
  }

  if (spotifyData.status === "error") {
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
              favoritesData.data.items,
              spotifyData.data.items.filter(
                ({ id }) => !favoritesData.data.items.some((favorite: any) => favorite.id === id)
              )
            ),
            3
          ),
        }}
      />
      <List
        data={{
          type: "tracks",
          items: take(
            concat(
              favoritesData.data.items,
              spotifyData.data.items.filter(
                ({ id }) => !favoritesData.data.items.some((favorite: any) => favorite.id === id)
              )
            ),
            50
          ),
        }}
        favorites={favoritesData.data.items.map(({ id }) => id)}
      />
    </div>
  )
}
