import { HomeIcon } from "@radix-ui/react-icons"
import { cookies } from "next/headers"

import { ModeToggle } from "@/components/ModeToggle"
import { Button } from "@/components/ui/button"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const NavBar = async () => {
  const cookieStore = cookies()
  const supabase = createSupabaseServerClient(cookieStore)

  const { data } = await supabase.auth.getUser()

  return (
    <div className="grid grid-cols-3 p-3">
      <div className="flex flex-row gap-3 m-3">
        <form action="/" method="get">
          <Button type="submit" variant="ghost">
            <HomeIcon className="h-4 w-4" />
          </Button>
        </form>
        {data?.user && (
          <div className="text-ellipsis">
            <form action="/profile" method="get">
              <Button type="submit" variant="link">
                {data.user?.email || ""}
              </Button>
            </form>
          </div>
        )}
      </div>
      <div className="flex flex-row gap-3 m-auto text-xl">my favorites</div>
      <div className="flex flex-row-reverse gap-3 m-3">
        {data?.user ? (
          <form action="/auth/signout" method="post">
            <Button type="submit">Sign Out</Button>
          </form>
        ) : (
          <form action="/login" method="get">
            <Button type="submit">Login</Button>
          </form>
        )}
        <ModeToggle />
      </div>
    </div>
  )
}
