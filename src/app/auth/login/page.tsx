'use client';

import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import supabaseClient from '@/lib/supabase-client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/ui/logo';

type LoginFormInputs = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const codeExchangeInProgress = useRef(false);
  const [showCheckEmailMessage, setShowCheckEmailMessage] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
    reset,
  } = useForm<LoginFormInputs>();
  const t = useTranslations();

  const startOAuthSignIn = async (provider: 'google' | 'apple') => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') || '/dashboard';
      const redirectTo = `${window.location.origin}/auth/login?next=${encodeURIComponent(next)}`;

      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
      // In most cases Supabase will redirect automatically; the fallback above ensures navigation.
    } catch (error) {
      console.error('OAuth sign-in error:', error);
      setError('root.serverError', {
        message: t('auth.authError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check for check-email message
    const params = new URLSearchParams(window.location.search);
    if (params.get('message') === 'check-email') {
      setShowCheckEmailMessage(true);
      // Remove message from URL
      params.delete('message');
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    }
    
    // Check for confirmation errors
    if (params.get('error') === 'confirmation-failed') {
      setError('root.serverError', {
        message: t('auth.confirmationFailed', { defaultValue: 'Email confirmation failed. Please try again or contact support.' }),
      });
      params.delete('error');
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    }
    
    if (params.get('error') === 'invalid-token') {
      setError('root.serverError', {
        message: t('auth.invalidToken', { defaultValue: 'Invalid confirmation link. Please try registering again.' }),
      });
      params.delete('error');
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [setError, t]);

  useEffect(() => {
    const handleAuthParams = async () => {
      // Check for code in query params
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code && !codeExchangeInProgress.current) {
        codeExchangeInProgress.current = true;
        setIsLoading(true);
        try {
          // Remove code from URL
          params.delete('code');
          const newUrl =
            window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
          window.history.replaceState({}, '', newUrl);

          const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
          
          if (error) throw error;

          if (data?.session) {
            const next = params.get('next') || '/dashboard';
            await queryClient.invalidateQueries();
            router.push(next);
          }
        } catch (error) {
          console.error('OAuth error:', error);
          setError('root.serverError', {
            message: t('auth.oauthFailed'),
          });
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Handle hash params for other auth flows
      if (window.location.hash) {
        setIsLoading(true);
        try {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');

          if (accessToken && refreshToken) {
            const {
              data: { user },
              error,
            } = await supabaseClient.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) throw error;

            if (user) {
              let next: string = '/';

              if (type === 'invite') {
                next = '/change-password';
              } else {
                // Get the next parameter from URL
                const params = new URLSearchParams(window.location.search);
                next = params.get('next') || next;
              }

              queryClient.invalidateQueries();
              router.push(next);
            }
          }
        } catch (error) {
          console.error('Error setting session:', error);
          setError('root.serverError', {
            message: t('auth.authError'),
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleAuthParams();
  }, [router, queryClient, setError, t]);

  const onSubmit = async (input: LoginFormInputs) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const { error } = await supabaseClient.auth.signInWithPassword(input);
      if (error) throw error;
      queryClient.invalidateQueries();
      reset();

      // Get the next parameter from URL
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next') || '/dashboard';
      queryClient.invalidateQueries();
      router.push(next);
    } catch (error) {
      console.error('Login error:', error);
      setError('root.serverError', { message: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium">
            <Logo alt={t('common.logo')} width={24} height={16} className="h-4 w-6" />
            UntitledOne
          </Link>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
        <Card className="w-full py-4">
        <CardHeader className="flex justify-center items-center gap-4 text-center">
          <Logo alt={t('common.logo')} width={60} height={40} />
          <CardTitle className="text-center text-lg font-extrabold">
            {t('auth.signInTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showCheckEmailMessage && (
            <Alert className="mb-6">
              <AlertDescription>
                {t('auth.checkEmailMessage', { defaultValue: 'Please check your email to confirm your account before signing in.' })}
              </AlertDescription>
            </Alert>
          )}
          {/* Social sign-in buttons */}
          <div className="grid gap-6 mb-6">
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full justify-center gap-2"
                disabled
                aria-disabled
                title="Apple sign-in coming soon"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path
                    d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                    fill="currentColor"
                  />
                </svg>
                Login with Apple (soon)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center gap-2"
                onClick={() => startOAuthSignIn('google')}
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                Login with Google
              </Button>
            </div>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                Or continue with
              </span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.emailLabel')}</Label>
                <Input
                  {...register('email', {
                    required: t('auth.emailRequired'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('auth.emailInvalid'),
                    },
                  })}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth.emailPlaceholder')}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <Input
                  {...register('password', {
                    required: t('auth.passwordRequired'),
                    minLength: {
                      value: 6,
                      message: t('auth.passwordMinLength'),
                    },
                  })}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('auth.passwordPlaceholder')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.signInLoading')}
                </>
              ) : (
                t('auth.signInButton')
              )}
            </Button>

            <div className="text-center">
              <span className="text-sm text-muted-foreground">{t('auth.haveAccount')} </span>
              <Link
                href="/auth/register"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                {t('auth.signUpButton')}
              </Link>
            </div>

            {errors.root?.serverError && (
              <Alert variant="destructive">
                <AlertDescription>{errors.root.serverError.message}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
            By clicking continue, you agree to our
            {' '}<a href="#" className="underline underline-offset-4 hover:text-primary">Terms of Service</a>{' '}and{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</a>.
        </p>
        </div>
      </div>
    </div>
  );
}
