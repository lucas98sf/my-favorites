import Profile from '@/components/Profile'
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <Profile user={user} />
}