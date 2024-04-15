'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import { LoginUser, SignUpUser } from '@/lib/user'
import { isAuthApiError, isAuthWeakPasswordError } from '@supabase/supabase-js'

export type Result<T = void> =
    T extends void ? void | {
        status: 'error',
        message: string
    } : {
        status: 'success',
        data: T
    } | {
        status: 'error',
        message: string
    }

export async function login(formData: LoginUser): Promise<Result<void>> {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
    })

    if (error) {
        if (isAuthApiError(error)) {
            return {
                status: 'error',
                message: error.message
            }
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: SignUpUser): Promise<Result<void>> {
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({ email: formData.email, password: formData.password })

    if (error) {
        if (isAuthWeakPasswordError(error) || isAuthApiError(error)) {
            return {
                status: 'error',
                message: error.message
            }
        }
        redirect('/error')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}