"use server"
import ky from "ky"
import { omit } from "lodash"
import NodeCache from "node-cache"

import { Result } from "@/lib/types"
import { Data, FavoriteItem } from "@/server/favorites"

const cache = new NodeCache({
  stdTTL: 60 * 60 * 24,
})

export const getTopRatedAnimes = async ({ excludeIds = [] }: { excludeIds?: string[] } = {}): Promise<Result<Data>> => {
  const cached = cache.get<Result<Data>>(`topRatedAnimes-${excludeIds.join(",")}`)
  if (cached) {
    return cached
  }

  const result = await fetch("https://api.myanimelist.net/v2/anime/ranking?ranking_type=all&limit=50", {
    headers: {
      "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID as string,
    },
  }).then(res =>
    res.json().then(data => {
      return data.data
        ?.map(({ node }: any) => ({
          id: String(node.id),
          title: node.title,
          image: node.main_picture?.medium,
        }))
        ?.filter((res: any) => !excludeIds.includes(res.id))
    })
  )

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

  cache.set(`topRatedAnimes-${excludeIds.join(",")}`, response)

  return response
}

export const getAnimeById = async (id: string) => {
  const cached = cache.get<Result<FavoriteItem>>(id)
  if (cached) {
    return cached
  }

  const result = await ky
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

  cache.set(id, result)

  return result
}

export const searchAnimes = async (search: string, limit = 1): Promise<Result<Data>> => {
  return fetch(
    `https://api.myanimelist.net/v2/anime?q=${search.replace(/[^\w\s]/gi, "").replace(/- /gi, "+")}&limit=${limit}`,
    {
      headers: {
        "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID as string,
      },
    }
  )
    .then(res =>
      res.json().then(({ data }) => {
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
    )
    .catch(error => {
      console.error(error)
      return {
        status: "error",
        message: "Could not find MAL data",
      }
    })
}

export const getUserTopRatedAnimes = async (username: string): Promise<Result<Data>> => {
  const cached = cache.get<Result<Data>>(`user-TopRatedAnimes-${username}`)
  if (cached) {
    return cached
  }

  if (!username) {
    return {
      status: "error",
      message: "No username provided",
    }
  }
  const getPage = (offset = 0) =>
    fetch(
      `https://api.myanimelist.net/v2/users/${username}/animelist?fields=list_status&offset=${offset}&status=completed`,
      {
        headers: {
          "X-MAL-CLIENT-ID": process.env.MAL_CLIENT_ID as string,
        },
      }
    )
      .then(res =>
        res.json().then(data => {
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
      )
      .catch(error => {
        console.error(error)
        return {
          status: "error",
          message: "Could not find MAL data",
        } as Result<any>
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

  cache.set(`user-TopRatedAnimes-${username}`, response)

  return response
}
