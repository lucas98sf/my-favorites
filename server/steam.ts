"use server"

import ky from "ky"
import { sortBy } from "lodash"
import { cache } from "react"

import { Result } from "@/lib/types"
import { searchGames } from "@/server/backloggd"
import { Data } from "@/server/favorites"

export const getPlayerProfileUsernameById = cache(async (id: string | null): Promise<Result<string | null>> => {
  try {
    if (!id) {
      return {
        status: "error",
        message: "No id provided",
      }
    }
    const url = new URL(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`)
    url.searchParams.append("key", process.env.STEAM_API_KEY as string)
    url.searchParams.append("steamids", id)
    return ky
      .get(url)
      .json<any>()
      .then(
        data =>
          ({
            status: "success",
            data: data.response.players[0].profileurl.split("/")[4],
          }) as Result<string>
      )
  } catch (error: any) {
    console.error(error.message)
    return {
      status: "error",
      message: "Could not find Steam data",
    }
  }
})

export const getUserTopSteamGames = cache(async (userId: string): Promise<Result<Data>> => {
  try {
    if (!userId) {
      return {
        status: "success",
        data: {
          type: "games",
          items: [],
        },
      }
    }

    const url = new URL(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`)
    url.searchParams.append("key", process.env.STEAM_API_KEY as string)
    url.searchParams.append("steamid", userId)
    url.searchParams.append("format", "json")
    const games = await ky
      .get(url.toString())
      .json<any>()
      .then(data =>
        data.response.games.map((game: any) => ({
          id: String(game.appid),
          playtime: game.playtime_forever,
        }))
      )

    const top5Games = sortBy(games, "playtime").reverse().slice(0, 5)

    const gameNames = await Promise.all(
      top5Games.flatMap(async game => {
        const gameData = await ky.get(`https://store.steampowered.com/api/appdetails?appids=${game?.id}`).json<any>()
        return gameData?.[game?.id]?.data?.name ? gameData[game.id].data.name : []
      })
    )

    const gameData = (await Promise.all(gameNames.map(game => searchGames(game)))).flatMap(game =>
      game.status === "success" ? game.data.items[0] : []
    )

    const result: Result<Data> = {
      status: "success",
      data: {
        type: "games",
        items: gameData,
      },
    }

    return result
  } catch (error: any) {
    console.error(error.message)
    return {
      status: "error",
      message: "Could not find Steam data",
    }
  }
})
