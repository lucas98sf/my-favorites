"use server"
import { kv } from "@vercel/kv"
import ky from "ky"

import { Result } from "@/lib/types"
import { Data, FavoriteItem } from "@/server/favorites"

export const getTopRatedMovies = async (): Promise<Result<Data>> => {
  try {
    const cached = await kv.get<Result<Data>>("topRatedMovies")
    if (cached) {
      return cached
    }

    const requestTMDBApi = async (page = 1) => {
      return ky
        .get(`https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=${page}`, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
          },
        })
        .json<any>()
        .then(data => {
          return data.results?.map((res: any) => ({
            id: String(res.id),
            title: res.title,
            image: `https://image.tmdb.org/t/p/w200${res.poster_path}`,
          }))
        })
    }

    const movies = await Promise.all([requestTMDBApi(1), requestTMDBApi(2)])

    if (!Array.isArray(movies)) {
      return movies as Result<Data>
    }

    const result: Result<Data> = {
      status: "success",
      data: {
        type: "movies",
        items: movies.flat(),
      },
    }

    kv.set("topRatedMovies", result)

    return result
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Could not find TMDB data",
    }
  }
}

export const getMovieById = async (id: string): Promise<Result<FavoriteItem>> => {
  try {
    // const cached = await kv.get<Result<FavoriteItem>>(`movieById-${id}`)
    // if (cached) {
    //   return cached
    // }

    const result: Result<FavoriteItem> = await ky
      .get(`https://api.themoviedb.org/3/movie/${id}`, {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
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
              image: data.poster_path ? `https://image.tmdb.org/t/p/w200${data.poster_path}` : null,
            },
          }) as Result<FavoriteItem>
      )

    // kv.set(`movieById-${id}`, result)

    return result
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Could not find TMDB data",
    }
  }
}

// unfortunately, the TMDB API does not support searching by letterboxd film id
export const searchMovies = async (search: string, limit = 1): Promise<Result<Data>> => {
  try {
    return ky
      .get(`https://api.themoviedb.org/3/search/movie?query=${encodeURI(search)}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
        },
      })
      .json<any>()
      .then(data => {
        return {
          status: "success",
          data: {
            type: "movies",
            items: data.results.map((result: any) => ({
              id: String(result.id),
              title: result.title,
              image: result.poster_path ? `https://image.tmdb.org/t/p/w200${result.poster_path}` : null,
            })),
          },
        } as Result<Data>
      })
  } catch (error) {
    console.error(error)
    return {
      status: "error",
      message: "Could not find TMDB data",
    }
  }
}
