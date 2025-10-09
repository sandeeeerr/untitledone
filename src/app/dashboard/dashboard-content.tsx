'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CircleAlert as CircleAlertIcon, X as XIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { DashboardData } from '@/lib/api/dashboard';

type DashboardContentProps = {
	initialData: DashboardData;
	children: React.ReactNode;
};

/**
 * Client Component for dashboard interactivity
 * Handles: welcome toast, email verification alert, profile completion
 */
export default function DashboardContent({
	initialData,
	children,
}: DashboardContentProps) {
	const { data: currentUser } = useCurrentUser();
	const { toast } = useToast();
	const t = useTranslations('dashboard');
	const [dashboardAlertDismissed, setDashboardAlertDismissed] =
		useState<boolean>(false);
	const [resendingEmail, setResendingEmail] = useState<boolean>(false);
	const [emailResent, setEmailResent] = useState<boolean>(false);

	// Once-per-session welcome toast (bottom-right), 20s, dismissible
	useEffect(() => {
		if (typeof window === 'undefined') return;
		try {
			const key = 'dashboard_welcome_toast_shown';
			const hasShown = window.sessionStorage.getItem(key) === '1';
			if (hasShown) return;
			window.sessionStorage.setItem(key, '1');
			const email = currentUser?.email ?? '';
			toast({
				title: t('welcome'),
				description: (
					<div className="text-sm leading-relaxed">
						<div className="opacity-80">{email}</div>
						<div className="mt-2">{t('developmentMessage')}</div>
						<div className="mt-2">
							{t('betaNote')}{' '}
							<a
								className="underline underline-offset-2"
								href="https://github.com/sandeeeerr/untitledone/issues"
								target="_blank"
								rel="noreferrer"
							>
								{t('contributeLink')}
							</a>
							.
						</div>
					</div>
				),
				duration: 20000,
				className: 'max-w-[560px]',
			});
		} catch {}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentUser?.id]);

	// Check localStorage for dismissed alert
	useEffect(() => {
		try {
			const v = window.localStorage.getItem('dashboardAlertDismissed');
			setDashboardAlertDismissed(v === '1');
		} catch {}
	}, []);

	const resendVerificationEmail = async () => {
		if (!currentUser?.email || resendingEmail) return;

		setResendingEmail(true);
		try {
			const supabase = (await import('@/lib/supabase-client')).default;
			const { error } = await supabase.auth.resend({
				type: 'signup',
				email: currentUser.email,
			});

			if (error) throw error;

			setEmailResent(true);
			setTimeout(() => setEmailResent(false), 5000);
		} catch (error) {
			console.error('Error resending verification email:', error);
		} finally {
			setResendingEmail(false);
		}
	};

	const needsProfile =
		!!initialData.profileCheck &&
		(initialData.profileCheck.needsDisplay ||
			initialData.profileCheck.needsUsername);
	const needsEmailVerification = !currentUser?.email_confirmed_at;
	const shouldShowAlert =
		(needsProfile || needsEmailVerification) && !dashboardAlertDismissed;

	return (
		<div className="space-y-6">
			{/* One-time alert (email verification / profile completion) */}
			{shouldShowAlert && (
				<div className="w-full p-6 flex justify-center">
					<div className="w-full max-w-lg">
						<Alert
							className="flex justify-between"
							variant={emailResent ? 'default' : 'default'}
						>
							<CircleAlertIcon />
							<div className="flex flex-1 flex-col gap-2">
								<AlertTitle>
									{emailResent
										? t('alerts.emailResentTitle', { default: 'Email sent!' })
										: t('alerts.verifyEmailTitle', {
												default: 'Verify your email to activate your account',
											})}
								</AlertTitle>
								<AlertDescription>
									{emailResent
										? t('alerts.emailResentDescription', {
												default: 'Check your inbox for the verification link.',
											})
										: t('alerts.verifyEmailDescription', {
												default:
													"We've sent a confirmation link to your inbox. Check your email to complete the sign-up.",
											})}
								</AlertDescription>
								{!emailResent && (
									<Button
										variant="link"
										className="h-auto p-0 text-sm font-normal justify-start"
										onClick={resendVerificationEmail}
										disabled={resendingEmail}
									>
										{resendingEmail
											? t('alerts.resendingEmail', { default: 'Sending...' })
											: t('alerts.resendEmail', {
													default: 'Resend verification email',
												})}
									</Button>
								)}
							</div>
							<button
								className="cursor-pointer"
								onClick={() => {
									try {
										window.localStorage.setItem('dashboardAlertDismissed', '1');
									} catch {}
									setDashboardAlertDismissed(true);
								}}
								aria-label="Close alert"
							>
								<XIcon className="size-5" />
								<span className="sr-only">Close</span>
							</button>
						</Alert>
					</div>
				</div>
			)}

			{/* Main dashboard content (Server Components passed as children) */}
			{children}
		</div>
	);
}

