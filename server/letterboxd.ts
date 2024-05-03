"use server"
import { kv } from "@vercel/kv"
import { parse } from "node-html-parser"

import { Result } from "@/lib/types"
import { Data } from "@/server/favorites"
import { searchMovies } from "@/server/tmdb"

export const getLetterboxdFavorites = async (username: string): Promise<Result<Data>> => {
  // const cached = await kv.get<Result<LetterboxdFavorite[]>>(`letterboxdFavorites-${username}`)
  // if (cached) {
  // return cached
  // }

  if (!username) {
    return {
      status: "success",
      data: {
        type: "movies",
        items: [],
      },
    }
  }

  const movies = await fetch(`https://letterboxd.com/${username}`)
    .then(res =>
      res.text().then(data => {
        const root = parse(data)
        const favorites = root.querySelectorAll("#favourites > ul > li > div")
        const result = favorites.map(elem => ({
          slug: elem.attrs["data-film-slug"],
          image: elem.querySelector("img")?.attrs["src"],
          name: elem.querySelector("img")?.attrs["alt"],
        }))
        return result
      })
    )
    .catch(error => {
      console.error(error)
    })

  if (!movies) {
    return {
      status: "success",
      data: {
        type: "movies",
        items: [],
      },
    }
  }

  const result: Result<Data> = {
    status: "success",
    data: {
      type: "movies",
      items: (await Promise.all(movies.map(movie => searchMovies(movie.slug)) ?? [])).flatMap(movie =>
        movie.status === "success" ? [movie.data.items[0]] : []
      ),
    },
  }

  // kv.set(`letterboxdFavorites-${username}`, result)

  return result
}
