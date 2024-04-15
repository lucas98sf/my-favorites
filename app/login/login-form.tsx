"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import { login, signInWithGoogle, signup } from "./action"
import { useState } from "react"
import { signupSchema, loginSchema, LoginUser, SignUpUser } from "@/lib/user"
import { z } from "zod"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { EnvelopeOpenIcon } from "@radix-ui/react-icons"
import { ErrorAlert } from "@/components/ErrorAlert"
import { Result } from "@/lib/types"

export default function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    reValidateMode: "onBlur"
  })

  const signUpForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    reValidateMode: "onBlur"
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
              message: result.message
            })
            loginForm.setError("password", {
              type: "manual",
              message: result.message
            })
          }
        }).catch(() => {
          setError(true)
        })
    }
    if (mode === "signup" && "confirmPassword" in values) {
      signup(values)
        .then((result: Result) => {
          if (result?.status === "error") {
            signUpForm.setError("email", {
              type: "manual",
              message: result.message
            })
            signUpForm.setError("password", {
              type: "manual",
              message: result.message
            })
          }
        }).catch(() => {
          setError(true)
        })
    }
    setLoading(false)
  }

  const handleGoogleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(false)

    signInWithGoogle()
      .then((result: Result) => {
        if (result?.status === "error") {
          setError(true)
        }
      }).catch(() => {
        setError(true)
      })
    setLoading(false)
  }

  return (
    <Card className="m-auto py-10 p-8">
      {error && <ErrorAlert />}
      <CardHeader>
        <h1 className="text-2xl font-bold">{mode === "login" ? "Login" : "Sign Up"}</h1>
        <form onSubmit={handleGoogleSubmit}>
          <Button
            disabled={loading}
            type="submit"
          >
            <EnvelopeOpenIcon className="mr-2 h-4 w-4" /> SignIn with Google
          </Button>
        </form>
      </CardHeader>
      {
        mode === "login" ? (
          <Form {...loginForm}>
            <form key="login" onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-8">
              <CardContent
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="email"
                  disabled={loading}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email" autoComplete="username email" {...field} />
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
                        <Input disabled={loading} type="password" autoComplete="password" {...field} />
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
                    variant="secondary" onClick={(e) => {
                      e.preventDefault()
                      setMode("signup")
                      signUpForm.reset()
                      setError(false)
                    }
                    }>Sign Up</Button>
                  <Button
                    disabled={loading}
                    type="submit">Login</Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        ) : (
          <Form {...signUpForm}>
            <form key="signup" onSubmit={signUpForm.handleSubmit(onSubmit)} className="space-y-8">
              <CardContent
                className="space-y-4"
              >
                <FormField
                  control={signUpForm.control}
                  name="email"
                  disabled={loading}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input disabled={loading} type="email" autoComplete="username email" {...field} />
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
                        <Input disabled={loading} type="password" autoComplete="new-password" {...field} />
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
                        <Input disabled={loading} type="password" autoComplete="new-password" {...field} />
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
                    variant="secondary" onClick={(e) => {
                      e.preventDefault()
                      setMode("login")
                      loginForm.reset()
                      setError(false)
                    }
                    }>Back</Button>
                  <Button type="submit" disabled={loading}>Create Account</Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        )
      }
    </Card>
  )
}