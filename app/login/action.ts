"use server"

import { isAuthApiError, isAuthWeakPasswordError } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { Result } from "@/lib/types"
import { LoginUser, SignUpUser } from "@/lib/user"

export async function login(formData: LoginUser): Promise<Result<void>> {
  const supabase = createClient()

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

export async function signUp(formData: SignUpUser): Promise<Result<void>> {
  const supabase = createClient()
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

export async function signInWithGoogle(): Promise<Result<void>> {
  const supabase = createClient()

  const redirectTo = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/auth/callback`

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
