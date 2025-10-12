import * as MentionPrimitive from '@diceui/mention';
import type * as React from 'react';

import { cn } from '@/lib/utils';

function Mention({ className, ...props }: React.ComponentProps<typeof MentionPrimitive.Root>) {
  return (
    <MentionPrimitive.Root
      data-slot="mention"
      className={cn(
        // Enhanced mention tag styling for better visibility
        '[&_[data-tag]]:rounded-md [&_[data-tag]]:bg-blue-500 [&_[data-tag]]:px-1.5 [&_[data-tag]]:py-0.5 [&_[data-tag]]:text-white [&_[data-tag]]:font-medium [&_[data-tag]]:text-sm [&_[data-tag]]:inline-flex [&_[data-tag]]:items-center [&_[data-tag]]:gap-1 [&_[data-tag]]:shadow-sm [&_[data-tag]]:border [&_[data-tag]]:border-blue-600 [&_[data-tag]]:cursor-default dark:[&_[data-tag]]:bg-blue-600 dark:[&_[data-tag]]:border-blue-500',
        // Ensure proper spacing and alignment
        '[&_[data-tag]]:mx-0.5 [&_[data-tag]]:my-0.5',
        className
      )}
      {...props}
    />
  );
}

function MentionLabel({
  className,
  ...props
}: React.ComponentProps<typeof MentionPrimitive.Label>) {
  return (
    <MentionPrimitive.Label
      data-slot="mention-label"
      className={cn('px-0.5 py-1.5 text-sm font-semibold', className)}
      {...props}
    />
  );
}

function MentionInput({
  className,
  ...props
}: React.ComponentProps<typeof MentionPrimitive.Input>) {
  return (
    <MentionPrimitive.Input
      data-slot="mention-input"
      className={cn(
        // Enhanced focus management and styling
        'shadow-xs focus-visible:outline-hidden flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 leading-relaxed',
        // Ensure proper text rendering and spacing
        'whitespace-pre-wrap break-words',
        // Prevent focus loss during typing
        'focus:outline-none focus-visible:outline-none',
        className
      )}
      {...props}
    />
  );
}

function MentionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MentionPrimitive.Content>) {
  return (
    <MentionPrimitive.Portal>
      <MentionPrimitive.Content
        data-slot="mention-content"
        className={cn(
          // Faster, more responsive animations
          'relative z-50 min-w-[8rem] max-w-[16rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg',
          // Faster animations for instant feel
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          // Quick slide animations
          'data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
          // Ensure proper positioning and visibility
          'data-[state=open]:duration-100 data-[state=closed]:duration-75',
          className
        )}
        {...props}
      >
        {children}
      </MentionPrimitive.Content>
    </MentionPrimitive.Portal>
  );
}

function MentionItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MentionPrimitive.Item>) {
  return (
    <MentionPrimitive.Item
      data-slot="mention-item"
      className={cn(
        // Enhanced hover and focus states
        'outline-hidden data-disabled:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-50 relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
        // Better visual feedback
        'transition-colors duration-75 hover:bg-accent/50 data-highlighted:bg-accent data-highlighted:text-accent-foreground',
        // Ensure proper text rendering
        'truncate',
        className
      )}
      {...props}
    >
      {children}
    </MentionPrimitive.Item>
  );
}

export { Mention, MentionContent, MentionInput, MentionItem, MentionLabel };
