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
  email: string
  password: string
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
      })
      if (error) throw error
      router.push('/') // of '/auth/login' of '/dashboard'
    } catch (error) {
      setError('root.serverError', {
        message: (error as Error).message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
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
                <Label htmlFor="email">{t('auth.emailLabel')}</Label>
                <Input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
                <Input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  id="password"
                  type="password"
                  placeholder="••••••••"
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
  )
}
