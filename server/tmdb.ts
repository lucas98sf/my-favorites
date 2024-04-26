"use server"
import { Result } from "@/lib/types"
import { Data, FavoriteItem } from "@/server/favorites"

export const getTopRatedMovies = async ({ excludeIds = [] }: { excludeIds?: string[] }): Promise<Result<Data>> => {
  const requestTMDBApi = async (page = 1) => {
    return fetch(`https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=${page}`, {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
      },
    }).then(res =>
      res.json().then(data => {
        return data.results
          ?.map((res: any) => ({
            id: res.id,
            title: res.title,
            image: `https://image.tmdb.org/t/p/w200${res.poster_path}`,
          }))
          ?.filter((res: any) => !excludeIds.includes(res.id))
      })
    )
  }

  const result = await Promise.all([requestTMDBApi(1), requestTMDBApi(2), requestTMDBApi(3)]).catch(error => {
    console.error(error)
    return {
      status: "error",
      message: "Could not find TMDB data",
    }
  })

  if (!Array.isArray(result)) {
    return result as Result<Data>
  }

  return {
    status: "success",
    data: {
      type: "movies",
      items: result.flat(),
    },
  }
}

export const getMovieById = async (id: string): Promise<Result<FavoriteItem>> => {
  return fetch(`https://api.themoviedb.org/3/movie/${id}`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    },
  })
    .then(res =>
      res.json().then(
        data =>
          ({
            status: "success",
            data: {
              id: data.id,
              title: data.title,
              image: `https://image.tmdb.org/t/p/w200${data.poster_path}`,
            },
          }) as Result<FavoriteItem>
      )
    )
    .catch(error => {
      console.error(error)
      return {
        status: "error",
        message: "Could not find TMDB data",
      }
    })
}

// unfortunately, the TMDB API does not support searching by letterboxd film id
export const getMovieByLetterboxdSlug = async (slug: string): Promise<Result<FavoriteItem>> => {
  return fetch(`https://api.themoviedb.org/3/search/movie?query=${slug.replace("-", "+")}&limit=1`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    },
  })
    .then(res =>
      res.json().then(data => {
        return {
          status: "success",
          data: {
            id: data.results?.[0]?.id,
            title: data.results?.[0]?.title,
            image: `https://image.tmdb.org/t/p/w200${data.results?.[0]?.poster_path}`,
          },
        } as Result<FavoriteItem>
      })
    )
    .catch(error => {
      console.error(error)
      return {
        status: "error",
        message: "Could not find TMDB data",
      }
    })
}
