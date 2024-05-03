"use server"
import { kv } from "@vercel/kv"
import { parse } from "node-html-parser"

import { Result } from "@/lib/types"

type LetterboxdFavorite = {
  slug: string
  name: string
  image: string
}

export const getLetterboxdFavorites = async (username: string): Promise<Result<LetterboxdFavorite[]>> => {
  const cached = await kv.get<Result<LetterboxdFavorite[]>>(`letterboxdFavorites-${username}`)
  if (cached) {
    return cached
  }

  if (!username) {
    return {
      status: "error",
      message: "No username provided",
    }
  }
  const result = fetch(`https://letterboxd.com/${username}`)
    .then(res =>
      res.text().then(data => {
        const root = parse(data)
        const favorites = root.querySelectorAll("#favourites > ul > li > div")
        const result = favorites.map(elem => ({
          slug: elem.attrs["data-film-slug"],
          image: elem.querySelector("img")?.attrs["src"],
          name: elem.querySelector("img")?.attrs["alt"],
        }))
        return {
          status: "success",
          data: result,
        }
      })
    )
    .catch(error => {
      console.error(error)
    }) as unknown as Promise<Result<any>>

  kv.set(`letterboxdFavorites-${username}`, result)

  return result
}
