import * as React from "react"

import { cn } from "@/lib/utils"

type CardContextValue = {
  hasHeader: boolean
  registerHeader: () => void
}

const CardContext = React.createContext<CardContextValue | null>(null)

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const [hasHeader, setHasHeader] = React.useState(false)

  const contextValue = React.useMemo<CardContextValue>(() => ({
    hasHeader,
    registerHeader: () => setHasHeader(true),
  }), [hasHeader])

  return (
    <CardContext.Provider value={contextValue}>
      <div
        ref={ref}
        className={cn(
          "rounded-md border bg-card text-card-foreground shadow",
          className
        )}
        {...props}
      />
    </CardContext.Provider>
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const ctx = React.useContext(CardContext)
  React.useEffect(() => {
    ctx?.registerHeader()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  )
})
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const ctx = React.useContext(CardContext)
  const base = "p-6"
  const withTop = ctx?.hasHeader ? "pt-0" : undefined
  return (
    <div ref={ref} className={cn(base, withTop, className)} {...props} />
  )
})
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 sm:p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
