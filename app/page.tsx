import Profile from "./Profile"
import TrackList from "./TrackList"

export default async function IndexPage() {
  return (
    <div className="flex flex-row">
      <Profile />
      <TrackList />
    </div>
  )
}
