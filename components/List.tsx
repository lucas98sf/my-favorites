"use client"
import { MagnifyingGlassIcon, StarFilledIcon, StarIcon } from "@radix-ui/react-icons"
import { concat, debounce, take, truncate } from "lodash"
import Image from "next/image"
import { type FC, useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Data, favoriteItem, FavoriteType, getFavorites, handleFavorites } from "@/server/favorites"
import { getSpotifyData, getSpotifyToken } from "@/server/spotify"

interface ListProps {
  data: Data
  favorites: string[]
}

const List: FC<ListProps> = ({ data: givenData, favorites: givenFavorites }) => {
  const [data, setData] = useState(givenData)
  const [searching, setSearching] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(givenFavorites)
  const [showClearButton, setShowClearButton] = useState(false)
  const [search, setSearch] = useState<string>("")

  const favoriteUserItem = useCallback(
    async (id: string, type: FavoriteType, action: "add" | "remove" = "add") => {
      setFavorites((await handleFavorites({ currentData: { [type]: favorites }, id, type, action }))[type])
      await favoriteItem({ id, type, action })
    },
    [favorites]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(
    debounce(async searchValue => {
      switch (givenData.type) {
        case "tracks": {
          if (searchValue === "") {
            setSearching(true)
            const favoritesData = await getFavorites()
            const spotifyData = await getSpotifyData(50)

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
            setSearching(false)
          }

          if (searchValue.length < 3) {
            return
          }

          setSearching(true)

          const spotifyToken = await getSpotifyToken()

          if (spotifyToken.status === "error") {
            return
          }

          const result = await fetch(
            `https://api.spotify.com/v1/search?query=${searchValue}&type=track&offset=0&limit=10`,
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
        }
        case "movies": {
          return
        }
        case "animes": {
          return
        }
        case "games": {
          return
        }
        default:
          return givenData.type satisfies never
      }
    }, 1000),
    [givenData.type]
  )

  useEffect(() => {
    if (search.length > 0) {
      setShowClearButton(true)
    } else {
      setShowClearButton(false)
    }
  }, [search])

  return (
    <Card>
      <CardHeader>{`${data.type}'s`}</CardHeader>
      <CardContent>
        <Label>Search</Label>
        <div className="flex flex-row items-center px-3 mb-6">
          <Input
            type="text"
            onChange={e => {
              setSearch(e.target.value)
              handleSearch(e.target.value)
            }}
            value={search}
          />
          {showClearButton && (
            <Button
              variant="ghost"
              className="w-0.5"
              onClick={() => {
                setSearch("")
                handleSearch("")
              }}
            >
              X
            </Button>
          )}
          {searching && <MagnifyingGlassIcon className="ml-4 w-6 h-6 text-gray-400" />}
        </div>
        <ScrollArea className="h-[70vh] p-4">
          <ul>
            {data.items.map(item => (
              <li key={item.id} className="flex flex-col w-[250px]">
                <div className="flex flex-row">
                  {favorites?.includes(item.id) ? (
                    <StarFilledIcon
                      className="w-8 h-8 text-yellow-400"
                      onClick={() => favoriteUserItem(item.id, data.type, "remove")}
                    />
                  ) : (
                    <StarIcon
                      className="w-8 h-8 text-yellow-400"
                      onClick={() => favoriteUserItem(item.id, data.type)}
                    />
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
