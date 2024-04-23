import { type FC } from "react"

import { Data, ProfileData } from "@/app/action"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"

const Profile: FC<{
  profileData: ProfileData
  spotifyData: Data
}> = ({ profileData, spotifyData }) => {
  return (
    <Card className="m-auto py-10 p-8 mx-24">
      <div className="flex flex-row justify-around gap-4">
        <Avatar>
          <AvatarImage src={profileData.avatar_url} alt={profileData.username ?? undefined} />
          <AvatarFallback>{(profileData.full_name as string).split(" ").map(s => s[0].toUpperCase())}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold">{profileData.username}</h1>
          <span className="mb-6">{profileData.full_name}</span>
          <div className="tracks flex flex-col gap-2">
            <span>Favorite track&apos;s</span>
            {spotifyData?.items?.map((track: any, index: number) => (
              <iframe
                key={index}
                src={`https://open.spotify.com/embed/track/${track.id}`}
                style={{
                  borderRadius: "14px",
                }}
                width="600"
                height="152"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
export default Profile
