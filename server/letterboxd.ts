"use server"
import { parse } from "node-html-parser"

import { Result } from "@/lib/types"

export const getLetterboxdFavorites = async (
  username: string
): Promise<
  Result<{
    items: {
      id: string
      name: string
      slug: string
      image: string
    }[]
  }>
> => {
  return fetch(`https://letterboxd.com/${username}`)
    .then(res =>
      res.text().then(data => {
        const root = parse(data)
        const favorites = root.querySelectorAll("#favourites > ul > li > div")
        const result = favorites.map(elem => ({
          id: elem.attrs["data-film-id"],
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
}
