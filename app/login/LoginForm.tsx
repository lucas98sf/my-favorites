"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { EnvelopeOpenIcon, SpeakerLoudIcon } from "@radix-ui/react-icons"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { ErrorAlert } from "@/components/ErrorAlert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Result } from "@/lib/types"
import { loginSchema, LoginUser, signUpSchema, SignUpUser } from "@/lib/types"

import { login, signInWithGoogle, signInWithSpotify, signUp } from "./action"

export default function LoginForm() {
  const [mode, setMode] = useState<"login" | "signUp">("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    reValidateMode: "onBlur",
  })

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    reValidateMode: "onBlur",
  })

  const onSubmit = (values: LoginUser | SignUpUser) => {
    setLoading(true)
    setError(false)

    if (mode === "login") {
      login(values)
        .then((result: Result) => {
          if (result?.status === "error") {
            loginForm.setError("email", {
              type: "manual",
              message: result.message,
            })
            loginForm.setError("password", {
              type: "manual",
              message: result.message,
            })
          }
        })
        .catch(() => {
          setError(true)
        })
    }

    if (mode === "signUp" && "confirmPassword" in values) {
      signUp(values)
        .then((result: Result) => {
          if (result?.status === "error") {
            signUpForm.setError("email", {
              type: "manual",
              message: result.message,
            })
            if (result.code !== "user_already_exists") {
              signUpForm.setError("password", {
                type: "manual",
                message: result.message,
              })
            }
          }
        })
        .catch(() => {
          setError(true)
        })
    }

    setLoading(false)
  }

  const handleGoogleSubmit = async () => {
    setLoading(true)
    setError(false)

    signInWithGoogle()
      .then((result: Result) => {
        if (result?.status === "error") {
          setError(true)
        }
      })
      .catch(() => {
        setError(true)
      })

    setLoading(false)
  }

  const handleSpotifySubmit = async () => {
    setLoading(true)
    setError(false)

    signInWithSpotify()
      .then((result: Result) => {
        if (result?.status === "error") {
          setError(true)
        }
      })
      .catch(() => {
        setError(true)
      })

    setLoading(false)
  }

  return (
    <Card className="m-auto py-10 p-8">
      {error && <ErrorAlert />}
      <CardHeader>
        <h1 className="text-2xl font-bold">{mode === "login" ? "Login" : "Sign Up"}</h1>
        <div className="flex flex-col gap-3">
          <form onSubmit={handleGoogleSubmit}>
            <Button disabled={loading} type="submit" className="w-[100%]">
              <EnvelopeOpenIcon className="mr-2 h-4 w-4" /> SignIn with Google
            </Button>
          </form>
          <form onSubmit={handleSpotifySubmit}>
            <Button disabled={loading} type="submit" className="w-[100%]">
              <SpeakerLoudIcon className="mr-2 h-4 w-4" /> SignIn with Spotify
            </Button>
          </form>
        </div>
      </CardHeader>
      {mode === "login" ? (
        <Form {...loginForm}>
          <form key="login" onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-8">
            <CardContent className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                disabled={loading}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="username email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                disabled={loading}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <div className="flex flex-row gap-3 mt-[0.1rem]">
                <Button
                  disabled={loading}
                  variant="secondary"
                  onClick={_ => {
                    setMode("signUp")
                    signUpForm.reset()
                    setError(false)
                  }}
                >
                  Sign Up
                </Button>
                <Button disabled={loading} type="submit">
                  Login
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      ) : (
        <Form {...signUpForm}>
          <form key="signUp" onSubmit={signUpForm.handleSubmit(onSubmit)} className="space-y-8">
            <CardContent className="space-y-4">
              <FormField
                control={signUpForm.control}
                name="email"
                disabled={loading}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="username email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signUpForm.control}
                name="password"
                disabled={loading}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signUpForm.control}
                name="confirmPassword"
                disabled={loading}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <div className="flex flex-row gap-3 mt-[0.1rem]">
                <Button
                  disabled={loading}
                  variant="secondary"
                  onClick={_ => {
                    setMode("login")
                    loginForm.reset()
                    setError(false)
                  }}
                >
                  Back
                </Button>
                <Button type="submit" disabled={loading}>
                  Create Account
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      )}
    </Card>
  )
}
