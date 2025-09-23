'use client'

import * as React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Star, Users, Zap, Shield, Github } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/ui/logo'
import Link from 'next/link'
import LandingHeader from '@/components/organisms/public-header'

export default function LandingPage() {
  const { data: currentUser } = useCurrentUser()
  const router = useRouter()
  const t = useTranslations('landing')

  const handleGetStarted = () => {
    if (currentUser) {
      router.push('/dashboard')
    } else {
      router.push('/auth/register')
    }
  }

  const features = [
    {
      icon: Users,
      title: t('features.collaboration.title'),
      description: t('features.collaboration.description'),
    },
    {
      icon: Zap,
      title: t('features.creativity.title'),
      description: t('features.creativity.description'),
    },
    {
      icon: Shield,
      title: t('features.ownership.title'),
      description: t('features.ownership.description'),
    },
  ]

  const testimonials = [
    {
      name: 'Daan de Maker',
      role: 'Audio Creative',
      content: t('testimonials.daan'),
      rating: 5,
    },
    {
      name: 'Nora Noize',
      role: 'Sound Designer',
      content: t('testimonials.nora'),
      rating: 5,
    },
    {
      name: 'Jonas Loop',
      role: 'Live Performer',
      content: t('testimonials.jonas'),
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <LandingHeader />

      {/* Hero Section */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-36 pb-16 text-center">
        <div className="mb-10 flex items-center justify-center">
          <div className="inline-flex items-center gap-3 rounded-full border bg-background/70 px-3 py-1.5 text-sm">
            <Badge variant="secondary" className="px-2 py-0.5">{t('hero.badge')}</Badge>
            <span className="text-muted-foreground hidden sm:inline">{t('contributePrefix')}</span>
            <a
              href="https://github.com/sandeeeerr/untitledone"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-medium hover:underline"
            >
              <Github className="h-4 w-4" /> {t('contributeLink')}
            </a>
          </div>
        </div>
        <h1 className="mb-6 text-4xl font-bold tracking-tighter sm:text-6xl lg:text-7xl">
          {t('hero.title')}
        </h1>
        <p className="mx-auto mb-3 max-w-2xl text-lg text-muted-foreground">
          {t('hero.description')}
        </p>
        <p className="mx-auto mb-8 max-w-3xl text-base text-muted-foreground">
          {t('hero.tagline')}
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={handleGetStarted} className="group">
            {currentUser ? t('hero.dashboard') : t('hero.getStarted')}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          {!currentUser && (
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/login">{t('hero.login')}</Link>
            </Button>
          )}
        </div>
        {/* Mockup screenshot (theme-aware) */}
        <div className="mt-16  hidden sm:block">
          <div className="mx-auto max-w-6xl">
            {/* Light theme image */}
            <Image
              src="/images/ss_light.png"
              alt="UntitledOne dashboard with files and feedback"
              width={2000}
              height={1125}
              priority
              className="w-full h-auto dark:hidden"
            />
            {/* Dark theme image */}
            <Image
              src="/images/ss_dark.png"
              alt="UntitledOne dashboard with files and feedback"
              width={2000}
              height={1125}
              priority
              className="w-full h-auto hidden dark:block"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tighter sm:text-4xl">
            {t('features.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {t('features.description')}
          </p>
          <div className="mx-auto mt-6 max-w-2xl text-left text-sm text-muted-foreground">
            <ul className="grid gap-2 sm:grid-cols-2">
              <li>• {t('features.bullets.fileSharing')}</li>
              <li>• {t('features.bullets.timeFeedback')}</li>
              <li>• {t('features.bullets.versioning')}</li>
              <li>• {t('features.bullets.ownership')}</li>
            </ul>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tighter sm:text-4xl">
            {t('testimonials.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            {t('testimonials.description')}
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardDescription>{testimonial.content}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Logo alt="Logo" width={40} height={25} />
              <p className="text-sm text-muted-foreground ml-4">
                © 2025 {t('footer.copyright')}
              </p>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">
                {t('footer.privacy')}
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                {t('footer.terms')}
              </Link>
              <a href="https://github.com/sandeeeerr/untitledone" className="hover:text-foreground" target="_blank" rel="noopener noreferrer">
                {t('footer.links.github')}
              </a>
              <a href="https://docs.untitledone.nl" className="hover:text-foreground" target="_blank" rel="noopener noreferrer">
                {t('footer.links.docs')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
