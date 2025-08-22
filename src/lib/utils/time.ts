/**
 * Format relative time using Intl.RelativeTimeFormat
 */
export function formatRelativeTime(date: string | Date, locale?: string): string {
  try {
    const targetDate = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInMs = targetDate.getTime() - now.getTime()
    const diffInMinutes = Math.round(diffInMs / (1000 * 60))
    const diffInHours = Math.round(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24))

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

    if (Math.abs(diffInMinutes) < 1) {
      return rtf.format(0, 'second')
    } else if (Math.abs(diffInMinutes) < 60) {
      return rtf.format(diffInMinutes, 'minute')
    } else if (Math.abs(diffInHours) < 24) {
      return rtf.format(diffInHours, 'hour')
    } else if (Math.abs(diffInDays) < 7) {
      return rtf.format(diffInDays, 'day')
    } else {
      // For longer periods, show the formatted date
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }).format(targetDate)
    }
  } catch {
    return typeof date === 'string' ? date : date.toLocaleDateString()
  }
}

/**
 * Fallback function for when translations are available
 * This maintains compatibility with existing translation keys
 */
export function formatRelativeTimeWithTranslations(
  date: string | Date,
  translations: {
    justNow: string
    hoursAgo: (count: number) => string
    yesterday: string
    daysAgo: (count: number) => string
  }
): string {
  try {
    const targetDate = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return translations.justNow
    if (diffInHours < 24) return translations.hoursAgo(diffInHours)
    if (diffInHours < 48) return translations.yesterday
    if (diffInHours < 168) return translations.daysAgo(Math.floor(diffInHours / 24))
    
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(targetDate)
  } catch {
    return typeof date === 'string' ? date : date.toLocaleDateString()
  }
}
