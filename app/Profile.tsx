import { truncate } from "lodash"
import Image from "next/image"
import { type FC } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Data } from "@/server/favorites"
import { ProfileData } from "@/server/profiles"

const Profile: FC<{
  profileData: ProfileData
  spotifyData: Data
  moviesData: Data
}> = ({ profileData, spotifyData, moviesData }) => {
  return (
    <Card className="m-auto py-10 p-8 mx-24">
      <div className="tracks flex flex-col gap-2">
        <div className="flex flex-row gap-4 h-[20%]">
          <Avatar className="size-32">
            <AvatarImage src={profileData.avatar_url} alt={profileData.username ?? undefined} />
            <AvatarFallback>{(profileData.full_name as string).split(" ").map(s => s[0].toUpperCase())}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col my-auto">
            <h1 className="text-3xl font-bold">{profileData.username}</h1>
            <span className="mb-6">{profileData.full_name}</span>
          </div>
        </div>
        <div className="flex flex-row gap-4 mt-4">
          <div className="flex flex-col gap-4">
            <span className="mb-4">Tracks</span>
            {spotifyData?.items?.map((track: any, index: number) => (
              <iframe
                key={index}
                src={`https://open.spotify.com/embed/track/${track.id}`}
                style={{
                  borderRadius: "14px",
                }}
                width="300"
                height="80"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="eager"
              />
            ))}
          </div>
          <div className="flex flex-col">
            <span>Movies</span>
            <div className="grid grid-cols-2 gap-4">
              {moviesData?.items?.map((movie: any, index: number) => (
                <div key={index} className="w-28">
                  <div className="h-8 w-28 flex break-after-all">
                    <p className="text-xs overflow-ellipsis self-end inline-block">
                      {truncate(movie.title, {
                        length: 50,
                      })}
                    </p>
                  </div>
                  <Image
                    alt={movie.title}
                    src={movie.image}
                    width="110"
                    height="0"
                    style={{
                      borderRadius: "10%",
                      height: "auto",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
export default Profile
