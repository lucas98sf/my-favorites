"use server"
import { kv } from "@vercel/kv"
import ky from "ky"
import { sortBy } from "lodash"

import { Result } from "@/lib/types"
import { searchGames } from "@/server/backloggd"
import { Data } from "@/server/favorites"

export const getPlayerProfileUrlById = async (id: string): Promise<Result<string>> => {
  try {
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
            data: data.response.players[0].profileurl,
          }) as Result<string>
      )
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Could not find Steam data",
    }
  }
}

export const getUserTopSteamGames = async (userId: string): Promise<Result<Data>> => {
  try {
    // const cached = await kv.get<Result<Data>>(`userTopSteamGames-${userId}`)
    // if (cached) {
    // return cached
    // }

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

    // kv.set(`userTopSteamGames-${userId}`, result)

    return result
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Could not find Steam data",
    }
  }
}
