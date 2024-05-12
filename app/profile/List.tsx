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
import { searchGames } from "@/server/backloggd"
import { Data, favoriteItem, FavoriteType, getFavorites, handleFavorites } from "@/server/favorites"
import { searchAnimes } from "@/server/myanimelist"
import { getSpotifyToken, searchTrack as searchTracks } from "@/server/spotify"
import { searchMovies } from "@/server/tmdb"

interface ListProps {
  userId: string
  data: Data
  favorites: string[]
}

const List: FC<ListProps> = ({ userId, data: givenData, favorites: givenFavorites }) => {
  const [searching, setSearching] = useState(false)
  const [data, setData] = useState(givenData)
  const [favorites, setFavorites] = useState<string[]>(givenFavorites)
  const [showClearButton, setShowClearButton] = useState(false)
  const [search, setSearch] = useState<string>("")

  const favoriteUserItem = useCallback(
    async (id: string, type: FavoriteType, action: "add" | "remove" = "add") => {
      setFavorites((await handleFavorites({ currentData: { [type]: favorites }, id, type, action }))[type])
      await favoriteItem({ userId, id, type, action })
    },
    [favorites, userId]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce messes with the checking
  const handleSearch = useCallback(
    debounce(
      async searchValue => {
        if (searchValue === "") {
          setSearching(true)
          const favoritesData = await getFavorites(userId, data.type)

          if (favoritesData.status === "error") {
            console.error(favoritesData.message)
            return
          }

          setData({
            type: givenData.type,
            items: take(
              concat(
                favoritesData.data.items,
                givenData.items.filter(
                  ({ id }) => !favoritesData.data.items.some((favorite: any) => favorite.id === id)
                )
              ),
              25
            ),
          })
          setSearching(false)
        }

        if (searchValue.length < 3) {
          return
        }

        switch (givenData.type) {
          case "tracks": {
            setSearching(true)

            const spotifyToken = await getSpotifyToken(userId)

            if (spotifyToken.status === "error") {
              return
            }

            const tracksData = await searchTracks({
              spotifyToken: spotifyToken.data.access_token as string,
              search: searchValue,
              limit: 10,
            })

            if (tracksData.status === "error") {
              return
            }

            setData(tracksData.data)
            setSearching(false)
            return
          }
          case "movies": {
            setSearching(true)

            const moviesData = await searchMovies(searchValue, 10)

            if (moviesData.status === "error") {
              return
            }

            setData(moviesData.data)
            setSearching(false)
            return
          }
          case "animes": {
            setSearching(true)

            const animesData = await searchAnimes(searchValue, 10)

            if (animesData.status === "error") {
              return
            }

            setData(animesData.data)
            setSearching(false)
            return
          }
          case "games": {
            setSearching(true)

            const animesData = await searchGames(searchValue, 10)

            if (animesData.status === "error") {
              return
            }

            setData(animesData.data)
            setSearching(false)
            return
          }
          default:
            return givenData.type satisfies never
        }
      },
      1000,
      {
        leading: true,
      }
    ),
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
    <Card className="max-h-[85vh]">
      <CardHeader>{data.type}</CardHeader>
      <CardContent>
        <Label>Search</Label>
        <div className="flex flex-row items-center px-3 mb-6 relative">
          <Input
            className="-mr-6 w-[200px]"
            type="text"
            onChange={e => {
              setSearch(e.target.value)
            }}
            value={search}
          />
          {showClearButton && (
            <Button
              variant="ghost"
              className="rounded-full p-2 absolute right-10"
              onClick={() => {
                setSearch("")
                handleSearch("")
              }}
            >
              X
            </Button>
          )}
          <Button
            className="absolute right-0 p-0 px-2"
            disabled={searching}
            variant="ghost"
            onClick={() => handleSearch(search)}
          >
            <MagnifyingGlassIcon className={"w-6 h-6 text-gray-400"} />
          </Button>
        </div>
        <ScrollArea className="h-[60vh] p-4">
          <ul>
            {data.items.map(item => (
              <li key={crypto.randomUUID()} className="flex flex-col w-[220px]">
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
                    <p className="text-sm max-w-44 max-h-12 overflow-ellipsis line-clamp-2">{item.title}</p>
                    <p className="text-xs text-gray-500">
                      {truncate(item.description, {
                        length: 30,
                      })}
                    </p>
                  </div>
                </div>
                {item.image && (
                  <Image
                    priority
                    src={item.image}
                    alt={item.title}
                    width="0"
                    height="0"
                    sizes="100vw"
                    className="w-full h-auto rounded-sm mb-4"
                  />
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default List
