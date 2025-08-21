import { SiBandcamp, SiFacebook, SiInstagram, SiMixcloud, SiSoundcloud, SiSpotify, SiTiktok, SiTwitch, SiX, SiYoutube } from "react-icons/si";
import type { IconType } from "react-icons";
import type { SocialPlatform } from "@/lib/api/socials";

export const SOCIAL_PLATFORMS: Array<{ value: SocialPlatform; label: string; placeholder: string }> = [
  { value: "soundcloud", label: "SoundCloud", placeholder: "https://soundcloud.com/username" },
  { value: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/..." },
  { value: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel" },
  { value: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { value: "tiktok", label: "TikTok", placeholder: "https://www.tiktok.com/@username" },
  { value: "x", label: "X (Twitter)", placeholder: "https://x.com/username" },
  { value: "facebook", label: "Facebook", placeholder: "https://facebook.com/username" },
  { value: "twitch", label: "Twitch", placeholder: "https://twitch.tv/username" },
  { value: "bandcamp", label: "Bandcamp", placeholder: "https://username.bandcamp.com" },
  { value: "mixcloud", label: "Mixcloud", placeholder: "https://mixcloud.com/username" },
];

export const SocialIconMap: Record<SocialPlatform, IconType> = {
  soundcloud: SiSoundcloud,
  spotify: SiSpotify,
  youtube: SiYoutube,
  instagram: SiInstagram,
  tiktok: SiTiktok,
  x: SiX,
  facebook: SiFacebook,
  twitch: SiTwitch,
  bandcamp: SiBandcamp,
  mixcloud: SiMixcloud,
}; 