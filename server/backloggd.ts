"use server"
import igdb from "igdb-api-node"
import ky from "ky"
import { take } from "lodash"
import { parse } from "node-html-parser"

import { Result } from "@/lib/types"
import { Data, FavoriteItem } from "@/server/favorites"

export const getPopularGames = async ({ excludeIds = [] }: { excludeIds?: string[] } = {}): Promise<Result<Data>> => {
  const popularGames = await (await ky.get("https://www.backloggd.com/games/lib/popular/")).text()
  const games = parse(popularGames)
    .querySelectorAll(".card-img")
    .map(game => ({
      id: String(game.parentNode.parentNode.getAttribute("game_id")),
      title: game.getAttribute("alt") as string,
      image: game.getAttribute("src") as string,
    }))
    .filter((res: any) => !excludeIds.includes(res.id))

  return {
    status: "success",
    data: {
      type: "games",
      items: games,
    },
  }
}

export const searchGames = async (search: string, limit = 1): Promise<Result<Data>> => {
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
}

let igdbClient: ReturnType<typeof igdb> | null = null

export const getGameById = async (id: string): Promise<Result<FavoriteItem>> => {
  if (!igdbClient) {
    const formData = new FormData()
    formData.append("client_id", process.env.TWITCH_CLIENT_ID!)
    formData.append("client_secret", process.env.TWITCH_CLIENT_SECRET!)
    formData.append("grant_type", "client_credentials")
    const accessToken = await ky
      .post("https://id.twitch.tv/oauth2/token", { body: formData })
      .then(res => res.json<any>())
      .then(res => res.access_token)

    igdbClient = igdb(process.env.IGDB_CLIENT_ID, accessToken as string)
  }

  const game = await igdbClient.fields("name,cover.image_id").where(`id = ${id}`).request("/games")

  if (game.data.length === 0) {
    return {
      status: "error",
      message: "Game not found",
    }
  }

  return {
    status: "success",
    data: {
      id: String(game.data[0].id),
      title: game.data[0].name,
      image: `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.data[0].cover?.image_id}.jpg`,
    },
  }
}
