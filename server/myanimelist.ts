"use server"
import { kv } from "@vercel/kv"
import ky from "ky"
import { omit } from "lodash"
import { cache } from "react"

import { Result } from "@/lib/types"
import { Data, FavoriteItem } from "@/server/favorites"

export const getTopRatedAnimes = cache(async (): Promise<Result<Data>> => {
  try {
    const result = await ky
      .get("https://api.myanimelist.net/v2/anime/ranking?ranking_type=all&limit=40", {
        headers: {
          "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID as string,
        },
      })
      .json<any>()
      .then(data => {
        return data.data?.map(({ node }: any) => ({
          id: String(node.id),
          title: node.title,
          image: node.main_picture?.medium,
        }))
      })

    if (!result) {
      return {
        status: "error",
        message: "Could not find MAL data",
      }
    }

    const response = {
      status: "success",
      data: {
        type: "animes",
        items: result,
      },
    } as Result<Data>

    return response
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Could not find MAL data",
    }
  }
})

export const getAnimeById = cache(async (id: string): Promise<Result<FavoriteItem>> => {
  try {
    const result: Result<FavoriteItem> = await ky
      .get(`https://api.myanimelist.net/v1/anime/${id}`, {
        headers: {
          "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID as string,
        },
      })
      .json<any>()
      .then(
        data =>
          ({
            status: "success",
            data: {
              id: String(data.id),
              title: data.title,
              image: data.main_picture?.medium,
            },
          }) as Result<FavoriteItem>
      )
      .catch(error => {
        return ky
          .get(`https://api.jikan.moe/v4/anime/${id}`)
          .json<any>()
          .then(data => {
            return {
              status: "success",
              data: {
                id: String(data.mal_id),
                title: data.title,
                image: data.images.jpg.image_url,
              },
            } as Result<FavoriteItem>
          })
      })

    return result
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Could not find MAL data",
    }
  }
})

export const searchAnimes = async (search: string, limit = 1): Promise<Result<Data>> => {
  try {
    return ky
      .get(`https://api.myanimelist.net/v2/anime?q=${encodeURI(search)}&limit=${limit}`, {
        headers: {
          "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID as string,
        },
      })
      .json<{ data: any }>()
      .then(({ data }) => {
        return {
          status: "success",
          data: {
            type: "animes",
            items: data?.map(({ node }: any) => ({
              id: String(node.id),
              title: node.title,
              image: node.main_picture.medium,
            })),
          },
        } as Result<Data>
      })
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Could not find MAL data",
    }
  }
}

export const getUserTopRatedAnimes = cache(async (username: string): Promise<Result<Data>> => {
  try {
    if (!username) {
      return {
        status: "success",
        data: {
          type: "animes",
          items: [],
        },
      }
    }
    const getPage = (offset = 0) =>
      ky
        .get(
          `https://api.myanimelist.net/v2/users/${username}/animelist?fields=list_status&offset=${offset}&status=completed`,
          {
            headers: {
              "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID as string,
            },
          }
        )
        .json<any>()
        .then(data => {
          return {
            status: "success",
            data: {
              items: data.data.map(({ node, list_status }: any) => ({
                id: String(node.id),
                title: node.title,
                image: node.main_picture?.medium,
                score: list_status?.score,
              })),
              hasNext: !!data.paging.next,
            },
          } as Result<{
            items: FavoriteItem & { score: number }[]
            hasNext: boolean
          }>
        })

    let offset = 0
    let result = await getPage(offset)

    while (result.status === "success" && result.data.hasNext) {
      offset += 10
      const nextResult = await getPage(offset)
      if (nextResult.status === "success") {
        result.data.items.push(...nextResult.data.items)
        result.data.hasNext = nextResult.data.hasNext
      }
    }
    if (result.status === "error") {
      return {
        status: "error",
        message: "Could not find MAL data",
      }
    }

    const response = {
      status: "success",
      data: {
        type: "animes",
        items: result.data.items
          .flatMap((item: any) => (item.score > 9 ? [item] : []))
          .sort((a: any, b: any) => b.score - a.score)
          .map((item: any) => omit(item, "score") as FavoriteItem),
      },
    } as Result<Data>

    return response
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Could not find MAL data",
    }
  }
})
