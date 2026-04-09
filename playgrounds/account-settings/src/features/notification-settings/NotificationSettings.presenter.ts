import { useCallback } from "react";
import type {
  NotificationSettingsFacade,
  NotificationKey,
} from "./NotificationSettings.facade";

export interface NotificationSettingsPresenterProps {
  preferences: NotificationSettingsFacade["preferences"];
  updatePreference: NotificationSettingsFacade["updatePreference"];
}

export interface NotificationToggle {
  key: NotificationKey;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}

export interface NotificationSettingsPresenter {
  toggles: NotificationToggle[];
}

interface ToggleMeta {
  key: NotificationKey;
  label: string;
  description: string;
}

const TOGGLE_META: ToggleMeta[] = [
  {
    key: "reviewRequested",
    label: "Review requested",
    description: "Someone requests your review on a pull request.",
  },
  {
    key: "mentioned",
    label: "Mentioned",
    description: "Someone @mentions you in an issue or pull request.",
  },
  {
    key: "issueAssigned",
    label: "Issue assigned",
    description: "An issue is assigned to you.",
  },
];

export function useNotificationSettingsPresenter({
  preferences,
  updatePreference,
}: NotificationSettingsPresenterProps): NotificationSettingsPresenter {
  const handleToggle = useCallback(
    (key: NotificationKey, next: boolean) => {
      void updatePreference(key, next);
    },
    [updatePreference],
  );

  const toggles: NotificationToggle[] = TOGGLE_META.map((meta) => {
    const checked = preferences?.[meta.key] ?? false;
    return {
      key: meta.key,
      label: meta.label,
      description: meta.description,
      checked,
      onToggle: () => handleToggle(meta.key, !checked),
    };
  });

  return { toggles };
}
