import { memo } from "react";
import type { SettingsTab } from "./SettingsTabs.presenter";

export interface SettingsTabsNavProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

interface TabDef {
  key: SettingsTab;
  label: string;
}

const TABS: TabDef[] = [
  { key: "profile", label: "Profile" },
  { key: "notifications", label: "Notifications" },
];

export const SettingsTabsNav = memo(function SettingsTabsNav({
  activeTab,
  onTabChange,
}: SettingsTabsNavProps) {
  return (
    <nav role="tablist" className="mb-6 flex gap-1 border-b">
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
});
