"use server"
import ky from "ky"
import { sortBy } from "lodash"

import { Result } from "@/lib/types"
import { cache } from "@/server"
import { searchGames } from "@/server/backloggd"
import { Data } from "@/server/favorites"

export const getPlayerProfileUrlById = async (id: string): Promise<Result<string>> => {
  const url = new URL(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/`)
  url.searchParams.append("key", process.env.STEAM_API_KEY as string)
  url.searchParams.append("steamids", id)
  return fetch(url)
    .then(res =>
      res.json().then(
        data =>
          ({
            status: "success",
            data: data.response.players[0].profileurl,
          }) as Result<string>
      )
    )
    .catch(error => {
      console.error(error)
      return {
        status: "error",
        message: "Could not find Steam data",
      }
    })
}

export const getUserTopSteamGames = async (userId: string): Promise<Result<Data>> => {
  const cached = cache.get<Result<Data>>(`userTopSteamGames-${userId}`)
  if (cached) {
    return cached
  }

  if (!userId) {
    return {
      status: "error",
      message: "Steam ID is required",
    }
  }

  const url = new URL(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/`)
  url.searchParams.append("key", process.env.STEAM_API_KEY as string)
  url.searchParams.append("steamid", userId)
  url.searchParams.append("format", "json")
  const games = await fetch(url.toString())
    .then(res =>
      res.json().then(data =>
        data.response.games.map((game: any) => ({
          id: String(game.appid),
          playtime: game.playtime_forever,
        }))
      )
    )
    .catch(error => {
      console.error(error)
      return {
        status: "error",
        message: "Could not find Steam data",
      }
    })

  const top5Games = sortBy(games, "playtime").reverse().slice(0, 5)

  const gameNames = await Promise.all(
    top5Games.map(async game => {
      const gameData = await ky.get(`https://store.steampowered.com/api/appdetails?appids=${game.id}`).json<any>()
      return gameData[game.id].data.name
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

  cache.set(`userTopSteamGames-${userId}`, result)

  return result
}
