declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production"
      NEXT_PUBLIC_SUPABASE_URL?: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY
      SPOTIFY_CLIENT_ID?: string
      SPOTIFY_CLIENT_SECRET
      SPOTIFY_REDIRECT_URI
      TMDB_ACCESS_TOKEN
      MAL_CLIENT_ID?: string
      STEAM_API_KEY?: string
      TWITCH_CLIENT_ID?: string
      TWITCH_CLIENT_SECRET
      TWITCH_ACCESS_TOKEN
      KV_URL?: string
      KV_REST_API_URL?: string
      KV_REST_API_TOKEN?: string
      KV_REST_API_READ_ONLY_TOKEN?: string
    }
  }
}

export {}
