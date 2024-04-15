import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Button } from "@/components/ui/button";



export const NavBar = async () => {
    const supabase = createClient()

    const { data } = await supabase.auth.getUser()

    return data?.user ? (
        <form action="/auth/signout" method="post">
            <div>{data.user?.email || ""}</div>
            <Button
                className="fixed top-4 right-4"
                type="submit">Sign Out</Button>
        </form>
    ) : (
        <form action="/login" method="get">
            <Button
                className="fixed top-4 right-4"
                type="submit">login</Button>
        </form>
    )
}

