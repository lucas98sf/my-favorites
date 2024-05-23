"use server"

import igdb from "igdb-api-node"
import ky from "ky"
import { take } from "lodash"
import { parse } from "node-html-parser"
import { cache } from "react"

import { Result } from "@/lib/types"
import { Data, FavoriteItem } from "@/server/favorites"

export const getPopularGames = cache(async (): Promise<Result<Data>> => {
  try {
    const popularGames = await (await ky.get("https://www.backloggd.com/games/lib/popular/")).text()
    const games = parse(popularGames)
      .querySelectorAll(".card-img")
      .map(game => ({
        id: String(game.parentNode.parentNode.getAttribute("game_id")),
        title: game.getAttribute("alt") as string,
        image: game.getAttribute("src") as string,
      }))

    const result = {
      status: "success",
      data: {
        type: "games",
        items: games,
      },
    } as Result<Data>

    return result
  } catch (error: any) {
    console.error(error.message)
    return {
      status: "error",
      message: "Could not find Backloggd data",
    }
  }
})

export const searchGames = async (search: string, limit = 1): Promise<Result<Data>> => {
  try {
    const games = await (await ky.get(`https://www.backloggd.com/search/games/${encodeURI(search)}`)).text()
    const parsed = parse(games)
    const results = take(
      parsed.querySelectorAll(".card-img").map(game => ({
        id: String(game.parentNode.parentNode.getAttribute("game_id")),
        title: game.getAttribute("alt") as string,
        image: game.getAttribute("src") as string,
      })),
      limit
    )

    return {
      status: "success",
      data: {
        type: "games",
        items: results,
      },
    }
  } catch (error: any) {
    console.error(error.message)
    return {
      status: "error",
      message: "Could not find Backloggd data",
    }
  }
}

export const getGameById = cache(async (id: string): Promise<Result<FavoriteItem>> => {
  try {
    // const formData = new FormData()
    // formData.append("client_id", process.env.TWITCH_CLIENT_ID!)
    // formData.append("client_secret", process.env.TWITCH_CLIENT_SECRET!)
    // formData.append("grant_type", "client_credentials")
    // const accessToken = await ky
    //   .post("https://id.twitch.tv/oauth2/token", { body: formData })
    //   .then(data => data.json<any>())
    //   .then(data => data.access_token)

    const igdbClient = igdb(process.env.IGDB_CLIENT_ID, process.env.TWITCH_ACCESS_TOKEN)

    const game = await igdbClient.fields("name,cover.image_id").where(`id = ${id}`).request("/games")

    if (game.data.length === 0) {
      return {
        status: "error",
        message: "Game not found",
      }
    }

    const result: Result<FavoriteItem> = {
      status: "success",
      data: {
        id: String(game.data[0].id),
        title: game.data[0].name,
        image: `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.data[0].cover?.image_id}.jpg`,
      },
    }

    return result
  } catch (error: any) {
    console.error(error.message)
    return {
      status: "error",
      message: "Could not find IGDB data",
    }
  }
})
