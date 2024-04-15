'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { LoginUser, SignUpUser } from '@/lib/user'
import { isAuthApiError, isAuthWeakPasswordError } from '@supabase/supabase-js'
import { getURL } from '@/lib/utils'
import { Result } from '@/lib/types'

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

export async function signInWithGoogle(): Promise<Result<void>> {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
            redirectTo: `${getURL()}/auth/confirm`,
        },
    })

    if (error) {
        console.error(error)
        return {
            status: 'error',
            message: 'An error occurred'
        }
    }

    redirect(data.url)
}
