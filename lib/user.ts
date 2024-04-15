import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const signUpSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "the passwords did not match",
        path: ["confirmPassword"],
      })
    }
  })

export type LoginUser = z.infer<typeof loginSchema>
export type SignUpUser = z.infer<typeof signUpSchema>
