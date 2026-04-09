import { memo } from "react";
import { useNotificationSettingsPresenter } from "./NotificationSettings.presenter";
import type { NotificationSettingsFacade } from "./NotificationSettings.facade";

export const NotificationSettingsComponent = memo(
  function NotificationSettingsComponent({
    preferences,
    isPending,
    isFetching,
    updatePreference,
  }: NotificationSettingsFacade) {
    const { toggles } = useNotificationSettingsPresenter({
      preferences,
      updatePreference,
    });

    if (isPending || !preferences) {
      return <NotificationSettingsSkeleton />;
    }

    return (
      <ul
        className={`space-y-3 transition-opacity ${isFetching ? "opacity-70" : ""}`}
      >
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
  },
);

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
