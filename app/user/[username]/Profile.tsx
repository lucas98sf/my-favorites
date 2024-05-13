import { truncate } from "lodash"
import Image from "next/image"
import Link from "next/link"
import { type FC } from "react"

import LetterboxdIcon from "@/components/icons/LetterboxdIcon"
import MyanimelistIcon from "@/components/icons/MyanimelistIcon"
import SpotifyIcon from "@/components/icons/SpotifyIcon"
import SteamIcon from "@/components/icons/SteamIcon"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Data } from "@/server/favorites"
import { ProfileData } from "@/server/profiles"

const Profile: FC<{
  profileData: ProfileData
  tracksData: Data
  moviesData: Data
  animesData: Data
  gamesData: Data
}> = ({ profileData, tracksData, moviesData, animesData, gamesData }) => {
  return (
    <Card className="m-auto py-10 p-8 mx-24">
      <div className="tracks flex flex-col gap-2">
        <div className="grid grid-flow-row grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-row gap-3">
            <Avatar className="size-32">
              <AvatarImage src={profileData.avatar_url} alt={profileData.username} />
              <AvatarFallback>
                {profileData.full_name
                  ? profileData.full_name.split(" ").map(s => s[0].toUpperCase())
                  : profileData.username[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col my-auto">
              <h1 className="text-3xl font-bold">{profileData.username}</h1>
              <span className="mb-6">{profileData.full_name}</span>
            </div>
          </div>
          <div className="flex flex-row gap-4">
            {profileData.spotifyId && (
              <Link href={`https://open.spotify.com/user/${profileData.spotifyId}`} target="_blank">
                <SpotifyIcon />
              </Link>
            )}
            {profileData.steamUrl && (
              <Link href={profileData.steamUrl} target="_blank">
                <SteamIcon />
              </Link>
            )}
            {profileData.letterboxdUsername && (
              <Link href={`https://letterboxd.com/${profileData.letterboxdUsername}/`} target="_blank">
                <LetterboxdIcon />
              </Link>
            )}
            {profileData.myAnimeListUsername && (
              <Link href={`https://myanimelist.net/profile/${profileData.myAnimeListUsername}/`} target="_blank">
                <MyanimelistIcon />
              </Link>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-6 mt-4 sm:flex-row">
          {tracksData.items.length > 0 && (
            <div className="flex flex-col gap-2 sm:gap-4">
              <span className="mb-4">Tracks</span>
              {tracksData.items.map((track: any, index: number) => (
                <iframe
                  key={index}
                  src={`https://open.spotify.com/embed/track/${track.id}`}
                  style={{
                    borderRadius: "18px",
                  }}
                  width="300"
                  height="80"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="eager"
                />
              ))}
            </div>
          )}
          {moviesData.items.length > 0 && (
            <div className="flex flex-col">
              <span>Movies</span>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {moviesData?.items?.map((movie: any, index: number) => (
                  <div key={index} className="w-[144px]">
                    <div className="h-8 w-[144px] flex break-after-all">
                      <p className="text-xs overflow-ellipsis self-end inline-block">
                        {truncate(movie.title, {
                          length: 50,
                        })}
                      </p>
                    </div>
                    <Image
                      loading="eager"
                      alt={movie.title}
                      src={movie.image}
                      width="144"
                      height="192"
                      className="w-[144px] h-[192px] rounded-sm object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {animesData.items.length > 0 && (
            <div className="flex flex-col">
              <span>Animes</span>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {animesData?.items?.map((anime: any, index: number) => (
                  <div key={index} className="w-[144px]">
                    <div className="h-8 w-[144px] flex break-after-all">
                      <p className="text-xs overflow-ellipsis self-end inline-block">
                        {truncate(anime.title, {
                          length: 50,
                        })}
                      </p>
                    </div>
                    <Image
                      loading="eager"
                      alt={anime.title}
                      src={anime.image}
                      width="144"
                      height="192"
                      className="w-[144px] h-[192px] rounded-sm object-fill"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {gamesData.items.length > 0 && (
            <div className="flex flex-col">
              <span>Games</span>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {gamesData?.items?.map((game: any, index: number) => (
                  <div key={index} className="w-[144px]">
                    <div className="h-8 w-[144px] flex break-after-all">
                      <p className="text-xs overflow-ellipsis self-end inline-block">
                        {truncate(game.title, {
                          length: 50,
                        })}
                      </p>
                    </div>
                    <Image
                      loading="eager"
                      alt={game.title}
                      src={game.image}
                      width="144"
                      height="192"
                      className="w-[144px] h-[192px] rounded-sm object-fill"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
export default Profile
