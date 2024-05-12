import { HomeIcon, PersonIcon } from "@radix-ui/react-icons"
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
            <HomeIcon className="h-6 w-6" />
          </Button>
        </form>
        {data?.user && (
          <div className="text-ellipsis">
            <form action="/profile" method="get">
              <Button className="hidden sm:block" type="submit" variant="link">
                {data.user?.email || ""}
              </Button>
              <Button className="sm:hidden" type="submit" variant="link">
                <PersonIcon className="h-6 w-6" />
              </Button>
            </form>
          </div>
        )}
      </div>
      <div className="flex flex-row gap-3 m-auto text-xs xl:text-xl">My Favorites</div>
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
