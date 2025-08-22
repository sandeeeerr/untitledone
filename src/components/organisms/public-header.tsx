"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User2, LogOut, Monitor } from "lucide-react"
import UserAvatar from "@/components/atoms/user-avatar"
import { Logo } from "@/components/ui/logo"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useProfile } from "@/lib/api/queries"
import supabaseClient from "@/lib/supabase-client"
import { useState } from "react"
import { SettingsModal } from "@/components/molecules/settings-modal"

export default function LandingHeader() {
	const { data: currentUser } = useCurrentUser()
	const { data: profile } = useProfile()
	const tNav = useTranslations("navigation")
	const tLanding = useTranslations("landing")
	const t = useTranslations("common")
	const tActions = useTranslations("actions")
	const [showSettings, setShowSettings] = useState(false)

	const onLogout = async () => {
		const { error } = await supabaseClient.auth.signOut()
		if (error) alert(error.message)
		window.location.reload()
	}

	return (
		<header className="fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
				<div className="flex items-center ">
					<Link href="/" aria-label={t('home')} className="inline-flex items-center">
						<Logo alt="Logo" width={26} height={16} className="h-[16px] w-[26px]" />
					</Link>
					<div className="flex items-center gap-2">
						<Button variant="ghost" disabled>
							{tNav("explore")}
						</Button>
					</div>
				</div>
				<nav className="flex items-center gap-2">
					{currentUser ? (
						<>
							<Button variant="ghost" asChild>
								<Link href="/dashboard">{tLanding("nav.dashboard")}</Link>
							</Button>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<button aria-label={t('userMenu')} className="rounded-full">
										<UserAvatar
											className="h-9 w-9 border"
											name={profile?.display_name || null}
											username={profile?.username || null}
											userId={currentUser.id}
											src={profile?.avatar_url || null}
										/>
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-48">
									<DropdownMenuItem asChild>
										<Link href={profile?.username ? `/u/${profile.username}` : "/dashboard"}>
											<User2 className="h-[1.1rem] w-[1.1rem]" />
											<span className="ml-2">{tNav("profile")}</span>
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem onClick={() => setShowSettings(true)}>
										<Monitor className="h-[1.1rem] w-[1.1rem]" />
										<span className="ml-2">{tActions("openSettings")}</span>
									</DropdownMenuItem>
									<DropdownMenuItem onClick={onLogout}>
										<LogOut className="h-[1.1rem] w-[1.1rem]" />
										<span className="ml-2">{tActions("logout")}</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							<SettingsModal open={showSettings} onOpenChange={setShowSettings} />
						</>
					) : (
						<>
							<Button variant="ghost" asChild>
								<Link href="/auth/login">{tLanding("nav.login")}</Link>
							</Button>
							<Button asChild>
								<Link href="/auth/register">{tLanding("nav.signup")}</Link>
							</Button>
						</>
					)}
				</nav>
			</div>
		</header>
	)
}


