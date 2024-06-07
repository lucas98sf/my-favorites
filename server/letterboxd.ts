"use server"
import ky from "ky"
import { parse } from "node-html-parser"
import { cache } from "react"

import { Result } from "@/lib/types"
import { Data } from "@/server/favorites"
import { searchMovies } from "@/server/tmdb"

export const getLetterboxdFavorites = cache(async (username: string): Promise<Result<Data>> => {
  try {
    if (!username) {
      return {
        status: "success",
        data: {
          type: "movies",
          items: [],
        },
      }
    }

    const movies = await ky
      .get(`https://letterboxd.com/${username}`)
      .text()
      .then(data => {
        const root = parse(data)
        const favorites = root.querySelectorAll("#favourites > ul > li > div")
        const result = favorites.map(elem => ({
          slug: elem.attrs["data-film-slug"],
          image: elem.querySelector("img")?.attrs["src"],
          name: elem.querySelector("img")?.attrs["alt"],
        }))
        return result
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
        items: (await Promise.all(movies.map(movie => searchMovies(movie.slug as string)) ?? [])).flatMap(movie =>
          movie.status === "success" && movie.data.items[0] ? [movie.data.items[0]] : []
        ),
      },
    }

    return result
  } catch (error: any) {
    console.error(error.message)
    return {
      status: "error",
      message: "Could not find Letterboxd data",
    }
  }
})
