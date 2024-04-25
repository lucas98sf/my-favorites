"use server"
import { isAuthApiError, isAuthWeakPasswordError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"
import { LoginUser, SignUpUser } from "@/lib/types"
import { getURL } from "@/lib/utils"

export async function login(formData: LoginUser): Promise<Result> {
  const supabase = createSupabaseServerClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) {
    if (isAuthApiError(error)) {
      return {
        status: "error",
        message: error.message,
      }
    }
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function signUp(formData: SignUpUser): Promise<Result> {
  const supabase = createSupabaseServerClient()
  const origin = headers().get("origin")

  const { error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error(error)
    if (isAuthWeakPasswordError(error) || isAuthApiError(error)) {
      return {
        status: "error",
        message: error.message,
        code: error.code,
      }
    }
    redirect("/error")
  }

  revalidatePath("/", "layout")
  redirect("/")
}

export async function signInWithGoogle(): Promise<Result> {
  const supabase = createSupabaseServerClient()
  const redirectTo = `${getURL()}auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      redirectTo,
    },
  })

  if (error) {
    console.error(error)
    return {
      status: "error",
      message: "An error occurred",
    }
  }

  redirect(data.url)
}

export async function signInWithSpotify(): Promise<Result> {
  const client = createSupabaseServerClient()
  const redirectTo = `${getURL()}auth/callback/spotify`

  const { data, error } = await client.auth.signInWithOAuth({
    provider: "spotify",
    options: {
      redirectTo,
      scopes: "user-read-email user-read-private user-top-read",
      queryParams: {
        grant_type: "authorization_code",
      },
    },
  })

  if (error) {
    console.error(error)
    return {
      status: "error",
      message: "An error occurred",
    }
  }

  redirect(data.url)
}
