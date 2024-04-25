import { Result } from "@/lib/types"

export const getTopRatedMovies = async (): Promise<
  Result<{
    items: {
      id: string
      name: string
      image: string
    }[]
  }>
> => {
  const requestTMDBApi = async (page = 1) => {
    return fetch(`https://api.themoviedb.org/3/movie/top_rated?language=en-US&page=${page}`, {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
      },
    }).then(res =>
      res.json().then(data => {
        return data.results?.map((res: any) => ({
          id: res.id,
          name: res.title,
          image: `https://image.tmdb.org/t/p/w250${res.poster_path}`,
        }))
      })
    )
  }

  const result = await Promise.all([requestTMDBApi(1), requestTMDBApi(2), requestTMDBApi(3)])

  // console.log({ result: result.flat() })
  return {
    status: "success",
    data: {
      items: result.flat(),
    },
  }
}
