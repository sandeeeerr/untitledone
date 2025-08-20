'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import supabaseClient from '@/lib/supabase-client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/ui/logo'

type RegisterFormInputs = {
  displayName: string
  email: string
  password: string
  confirmPassword: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormInputs>()
  const t = useTranslations()

  const onSubmit = async (data: RegisterFormInputs) => {
    setIsLoading(true)
    try {
      const { error } = await supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName,
          },
        },
      })
      if (error) throw error
      router.push('/auth/login?message=check-email')
    } catch (error) {
      setError('root.serverError', {
        message: (error as Error).message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium">
            <Logo alt="Logo" width={24} height={16} className="h-4 w-6" />
            UntitledOne
          </Link>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full py-4">
        <CardHeader className="flex justify-center items-center gap-4">
          <Logo alt="Logo" width={60} height={40} />
          <CardTitle className="text-center text-lg font-extrabold">
            {t('auth.signUpTitle', { defaultValue: 'Create an account' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">{t('auth.displayNameLabel', { defaultValue: 'Display name' })}</Label>
                <Input
                  {...register('displayName', {
                    required: t('auth.displayNameRequired', { defaultValue: 'Display name is required' }),
                    minLength: {
                      value: 2,
                      message: t('auth.displayNameMinLength', { defaultValue: 'Display name must be at least 2 characters' }),
                    },
                    maxLength: {
                      value: 50,
                      message: t('auth.displayNameMaxLength', { defaultValue: 'Display name must be less than 50 characters' }),
                    },
                  })}
                  id="displayName"
                  type="text"
                  placeholder={t('auth.displayNamePlaceholder', { defaultValue: 'Enter your display name' })}
                />
                {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
                <p className="text-xs text-muted-foreground">
                  {t('auth.displayNameHelp', { defaultValue: 'This will be your public display name. A unique username will be automatically generated.' })}
                </p>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPasswordLabel', { defaultValue: 'Confirm password' })}</Label>
                <Input
                  {...register('confirmPassword', {
                    required: t('auth.confirmPasswordRequired', { defaultValue: 'Please confirm your password' }),
                    validate: (value) => {
                      const password = (document.getElementById('password') as HTMLInputElement)?.value;
                      return value === password || t('auth.passwordsDoNotMatch', { defaultValue: 'Passwords do not match' });
                    },
                  })}
                  id="confirmPassword"
                  type="password"
                  placeholder={t('auth.confirmPasswordPlaceholder', { defaultValue: 'Confirm your password' })}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('auth.signUpLoading', { defaultValue: 'Creating account...' })}
                </>
              ) : (
                t('auth.signUpButton', { defaultValue: 'Create account' })
              )}
            </Button>

            {errors.root?.serverError && (
              <Alert variant="destructive">
                <AlertDescription>{errors.root.serverError.message}</AlertDescription>
              </Alert>
            )}

            <p className="text-sm text-muted-foreground text-center">
              {t('auth.haveAccount', { defaultValue: 'Already have an account?' })}{' '}
              <Link
                href="/auth/login"
                className="text-sm font-medium text-primary hover:text-primary/80"
              >
                {t('auth.signInLink', { defaultValue: 'Sign in' })}
              </Link>
            </p>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  )
}
