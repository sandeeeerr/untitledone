'use client';

import { useForm } from 'react-hook-form';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
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

          // TODO: handle exchangeCodeForSession error and display error of redirect user with next router (no window.location.href) if data is returned

          await supabaseClient.auth.exchangeCodeForSession(code);

          const next = params.get('next') || '/';
          queryClient.invalidateQueries();
          window.location.href = next;
        } catch (error) {
          console.error('Error exchanging code for session:', error);
          setError('root.serverError', {
            message: t('auth.authError'),
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
      console.log(error);
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
        <Card className="max-w-md w-full py-4">
        <CardHeader className="flex justify-center items-center gap-4">
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
                  placeholder={t('auth.emailPlaceholder')}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
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
                  placeholder={t('auth.passwordPlaceholder')}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                {t('auth.forgotPassword')}
              </Link>
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
      </div>
    </div>
  );
}
