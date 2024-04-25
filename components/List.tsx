"use client"
import { MagnifyingGlassIcon, StarFilledIcon, StarIcon } from "@radix-ui/react-icons"
import { concat, debounce, take, truncate } from "lodash"
import Image from "next/image"
import { type FC, useCallback, useState } from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import useSupabaseBrowser from "@/lib/supabase/browser"
import { Data, favoriteItem, FavoriteType, getFavorites, handleFavorites } from "@/queries/favorites"
import { getSpotifyData, getSpotifyToken } from "@/queries/spotify"

interface ListProps {
  data: Data
  favorites: string[]
}

const List: FC<ListProps> = ({ data: givenData, favorites: givenFavorites }) => {
  const [data, setData] = useState(givenData)
  const [searching, setSearching] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(givenFavorites)
  const supabase = useSupabaseBrowser()

  const favoriteUserItem = useCallback(
    async (id: string, type: FavoriteType, action: "add" | "remove" = "add") => {
      setFavorites((await handleFavorites({ currentData: { [type]: favorites }, id, type, action }))[type])
      await favoriteItem(supabase, { id, type, action })
    },
    [favorites, supabase]
  )

  const handleSearch = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value === "") {
        const favoritesData = await getFavorites(supabase)
        const spotifyData = await getSpotifyData(supabase, 50)

        if (favoritesData.status === "error") {
          console.error(favoritesData.message)
          return
        }

        if (spotifyData.status === "error") {
          console.error(spotifyData.message)
          return
        }

        setData({
          type: givenData.type,
          items: take(
            concat(
              favoritesData.data.items,
              spotifyData.data.items.filter(
                ({ id }) => !favoritesData.data.items.some((favorite: any) => favorite.id === id)
              )
            ),
            50
          ),
        })
      }

      if (e.target.value.length < 3) {
        return
      }

      setSearching(true)

      const spotifyToken = await getSpotifyToken(supabase)

      if (spotifyToken.status === "error") {
        return
      }

      const result = await fetch(
        `https://api.spotify.com/v1/search?query=${e.target.value}&type=track&offset=0&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${spotifyToken?.data?.access_token}`,
          },
        }
      )
        .then(res => res.json())
        .catch(error => {
          console.error(error)
          return {
            status: "error",
            message: "There was an error fetching your spotify data",
          }
        })

      setData({
        type: "tracks",
        items: result.tracks?.items?.map((sd: any) => {
          return {
            id: sd.id,
            title: sd.name,
            description: sd.artists?.[0]?.name,
            image: sd.album?.images?.[0]?.url,
          }
        }),
      })
      setSearching(false)
    },
    [givenData.type, supabase]
  )

  return (
    <Card>
      <CardHeader>{`${data.type}'s`}</CardHeader>
      <CardContent>
        <Label>Search</Label>
        <div className="flex flex-row items-center px-3 mb-6">
          <Input
            type="text"
            className="mr-4"
            onChange={debounce(handleSearch, 250, {
              trailing: true,
            })}
          />
          {searching && <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />}
        </div>
        <ScrollArea className="h-[70vh] p-4">
          <ul>
            {data.items.map(item => (
              <li key={item.id} className="flex flex-col w-[250px]">
                <div className="flex flex-row">
                  {favorites?.includes(item.id) ? (
                    <StarFilledIcon
                      className="w-8 h-8 text-yellow-400"
                      onClick={() => favoriteUserItem(item.id, "tracks", "remove")}
                    />
                  ) : (
                    <StarIcon className="w-8 h-8 text-yellow-400" onClick={() => favoriteUserItem(item.id, "tracks")} />
                  )}
                  <div className="ml-2">
                    <p className="max-w-52 max-h-12 overflow-ellipsis line-clamp-2">{item.title}</p>
                    <p className="text-sm text-gray-500">
                      {truncate(item.description, {
                        length: 30,
                      })}
                    </p>
                  </div>
                </div>
                <Image
                  priority
                  src={item.image}
                  alt={item.title}
                  width="250"
                  height="250"
                  style={{
                    borderRadius: "10%",
                    marginBottom: "2rem",
                  }}
                />
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default List
