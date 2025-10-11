import { redirect } from 'next/navigation';

// Redirect /settings to /settings/profile by default
export default function SettingsPage() {
  redirect('/settings/profile');
}
