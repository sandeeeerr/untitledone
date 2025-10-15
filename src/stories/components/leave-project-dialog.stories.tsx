import type { Meta, StoryObj } from '@storybook/nextjs';
import { LeaveProjectDialog } from '@/components/molecules/leave-project-dialog';
import { ThemeProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Mock messages for translations
const messages = {
  projects: {
    actions: {
      leave: 'Leave project',
      leaving: 'Leaving...',
      leaveProjectConfirm: 'Are you sure you want to leave "{projectName}"? You will lose access to all project files and activity.',
    },
  },
};

const meta: Meta<typeof LeaveProjectDialog> = {
  title: 'Components/LeaveProjectDialog',
  component: LeaveProjectDialog,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    Story => (
      <NextIntlClientProvider messages={messages} locale="en">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Story />
        </ThemeProvider>
      </NextIntlClientProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LeaveProjectDialog>;

// Wrapper component to manage dialog state
const DialogWrapper = (args: Record<string, unknown>) => {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Open Leave Project Dialog
      </Button>
      <LeaveProjectDialog
        {...args}
        open={open}
        onOpenChange={setOpen}
        projectName="Test Project"
        onConfirm={() => {}}
      />
    </>
  );
};

export const Default: Story = {
  render: DialogWrapper,
  args: {
    projectName: 'My Awesome Music Project',
    onConfirm: () => {
      // Confirmed leaving project
    },
    isLeaving: false,
  },
};

export const Leaving: Story = {
  render: DialogWrapper,
  args: {
    projectName: 'My Awesome Music Project',
    onConfirm: () => {
      // Confirmed leaving project
    },
    isLeaving: true,
  },
};

export const LongProjectName: Story = {
  render: DialogWrapper,
  args: {
    projectName: 'This is a very long project name that might cause layout issues in the dialog',
    onConfirm: () => {
      // Confirmed leaving project
    },
    isLeaving: false,
  },
};
