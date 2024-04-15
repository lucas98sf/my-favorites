import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export const NavBar = async () => {
  const supabase = createClient()

  const { data } = await supabase.auth.getUser()

  return data?.user ? (
    <form action="/auth/signout" method="post">
      <div className="fixed top-4 left-4">{data.user?.email || ""}</div>
      <Button className="fixed top-4 right-4" type="submit">
        Sign Out
      </Button>
    </form>
  ) : (
    <form action="/login" method="get">
      <Button className="fixed top-4 right-4" type="submit">
        login
      </Button>
    </form>
  )
}
