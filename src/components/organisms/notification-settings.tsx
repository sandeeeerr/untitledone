"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface NotificationPreferences {
  email_mentions_enabled: boolean;
  in_app_mentions_enabled: boolean;
  email_frequency: "instant" | "daily";
}

export interface NotificationSettingsProps {
  /** Initial preferences */
  initialPreferences: NotificationPreferences;
}

/**
 * Notification Settings
 * 
 * Form component for managing notification preferences:
 * - Email notifications toggle
 * - In-app notifications toggle
 * - Email frequency (instant vs daily)
 * 
 * @example
 * <NotificationSettings
 *   initialPreferences={{
 *     email_mentions_enabled: true,
 *     in_app_mentions_enabled: true,
 *     email_frequency: "daily"
 *   }}
 * />
 */
export function NotificationSettings({ initialPreferences }: NotificationSettingsProps) {
  const t = useTranslations("notifications");
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>(initialPreferences);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if current preferences differ from initial
  const checkForChanges = (newPrefs: NotificationPreferences) => {
    const changed = 
      newPrefs.email_mentions_enabled !== initialPreferences.email_mentions_enabled ||
      newPrefs.in_app_mentions_enabled !== initialPreferences.in_app_mentions_enabled ||
      newPrefs.email_frequency !== initialPreferences.email_frequency;
    
    setHasChanges(changed);
  };

  const handleToggleEmail = (checked: boolean) => {
    const newPrefs = { ...preferences, email_mentions_enabled: checked };
    setPreferences(newPrefs);
    checkForChanges(newPrefs);
  };

  const handleToggleInApp = (checked: boolean) => {
    const newPrefs = { ...preferences, in_app_mentions_enabled: checked };
    setPreferences(newPrefs);
    checkForChanges(newPrefs);
  };

  const handleFrequencyChange = (value: string) => {
    const newPrefs = { ...preferences, email_frequency: value as "instant" | "daily" };
    setPreferences(newPrefs);
    checkForChanges(newPrefs);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      // Update initial preferences to current (reset hasChanges)
      initialPreferences.email_mentions_enabled = preferences.email_mentions_enabled;
      initialPreferences.in_app_mentions_enabled = preferences.in_app_mentions_enabled;
      initialPreferences.email_frequency = preferences.email_frequency;
      setHasChanges(false);

      toast({
        title: t("save_success"),
        description: t("save_success_description"),
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast({
        title: t("save_error"),
        description: t("save_error_description"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
        {/* Email Notifications Toggle */}
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="email-mentions" className="text-base font-medium cursor-pointer">
              {t("email_enabled")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("email_enabled_description")}
            </p>
          </div>
          <Switch
            id="email-mentions"
            checked={preferences.email_mentions_enabled}
            onCheckedChange={handleToggleEmail}
          />
        </div>

        {/* Email Frequency (only shown if email is enabled) */}
        {preferences.email_mentions_enabled && (
          <div className="rounded-lg border p-4 space-y-4">
            <div className="space-y-1">
              <Label className="text-base font-medium">
                {t("email_frequency_label")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("email_frequency_description")}
              </p>
            </div>

            <RadioGroup
              value={preferences.email_frequency}
              onValueChange={handleFrequencyChange}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="daily" id="frequency-daily" />
                <Label htmlFor="frequency-daily" className="cursor-pointer font-normal">
                  <div>
                    <div className="font-medium">{t("email_frequency_daily")}</div>
                    <div className="text-sm text-muted-foreground">
                      {t("email_frequency_daily_description")}
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="instant" id="frequency-instant" />
                <Label htmlFor="frequency-instant" className="cursor-pointer font-normal">
                  <div>
                    <div className="font-medium">{t("email_frequency_instant")}</div>
                    <div className="text-sm text-muted-foreground">
                      {t("email_frequency_instant_description")}
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* In-App Notifications Toggle */}
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="in-app-mentions" className="text-base font-medium cursor-pointer">
              {t("in_app_enabled")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("in_app_enabled_description")}
            </p>
          </div>
          <Switch
            id="in-app-mentions"
            checked={preferences.in_app_mentions_enabled}
            onCheckedChange={handleToggleInApp}
          />
        </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={cn(!hasChanges && "opacity-50")}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t("save_preferences")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

