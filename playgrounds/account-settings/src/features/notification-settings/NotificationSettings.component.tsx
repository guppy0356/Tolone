import { memo } from "react";
import { useNotificationSettingsPresenter } from "./NotificationSettings.presenter";
import type { NotificationSettingsFacade } from "./NotificationSettings.facade";
import type { NotificationPreferences } from "./NotificationSettings.api";

interface NotificationSettingsViewProps {
  preferences: NotificationPreferences;
  updatePreference: NotificationSettingsFacade["updatePreference"];
}

const NotificationSettingsView = memo(function NotificationSettingsView({
  preferences,
  updatePreference,
}: NotificationSettingsViewProps) {
  const { toggles } = useNotificationSettingsPresenter({
    preferences,
    updatePreference,
  });

  return (
    <ul className="space-y-3">
      {toggles.map((toggle) => (
        <li
          key={toggle.key}
          className="flex items-start justify-between rounded border p-3"
        >
          <div className="mr-4 flex-1">
            <label
              htmlFor={`toggle-${toggle.key}`}
              className="block font-medium"
            >
              {toggle.label}
            </label>
            <p className="text-sm text-gray-500">{toggle.description}</p>
          </div>
          <input
            id={`toggle-${toggle.key}`}
            type="checkbox"
            role="switch"
            checked={toggle.checked}
            onChange={toggle.onToggle}
            className="mt-1 size-5"
          />
        </li>
      ))}
    </ul>
  );
});

export function NotificationSettingsComponent({
  preferences,
  isPending,
  isFetching,
  updatePreference,
}: NotificationSettingsFacade) {
  if (isPending || !preferences) {
    return <NotificationSettingsSkeleton />;
  }

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-70" : ""}`}>
      <NotificationSettingsView
        preferences={preferences}
        updatePreference={updatePreference}
      />
    </div>
  );
}

function NotificationSettingsSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading notifications">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-16 w-full animate-pulse rounded bg-gray-200"
        />
      ))}
    </div>
  );
}
