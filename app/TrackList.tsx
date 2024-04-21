"use client"
import { concat, take } from "lodash"
import { useCallback, useEffect, useState } from "react"

import { getFavorites, getSpotifyData } from "@/app/action"
import List from "@/app/List"
import { ErrorAlert } from "@/components/ErrorAlert"
import { SuccessAlert } from "@/components/SuccessAlert"

export default function TrackList() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [spotifyData, setSpotifyData] = useState<any | null>(null)

  const getSpotify = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const favoritesData = await getFavorites()
    const spotifyData = await getSpotifyData(30)

    if (spotifyData.status === "error") {
      setError(spotifyData.message)
      return
    }

    if (favoritesData.status === "error") {
      setError(favoritesData.message)
      return
    }

    if (spotifyData.status === "success") {
      setSpotifyData({
        type: "tracks",
        items: take(
          concat(
            favoritesData.data.items,
            spotifyData.data.items.filter(
              ({ id }) => !favoritesData.data.items.some((favorite: any) => favorite.id === id)
            )
          ),
          30
        ),
      })
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    getSpotify()
  }, [getSpotify])

  return loading
    ? "Loading..."
    : spotifyData && (
        <>
          {success && <SuccessAlert message={success} />}
          {error && <ErrorAlert message={error} />}
          <List data={spotifyData}></List>
        </>
      )
}
