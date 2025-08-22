/**
 * Format date using Intl.DateTimeFormat with proper locale support
 */
export function formatDateTime(date: string | Date, locale?: string): string {
  try {
    const targetDate = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(targetDate)
  } catch {
    return typeof date === 'string' ? date : date.toLocaleDateString()
  }
}

/**
 * Format relative time using Intl.RelativeTimeFormat
 */
export function formatTimeAgo(date: string | Date, locale?: string): string {
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
      return formatDateTime(targetDate, locale)
    }
  } catch {
    return typeof date === 'string' ? date : date.toLocaleDateString()
  }
}
