import { useState, useCallback } from "react";

export type SettingsTab = "profile" | "notifications";

export interface SettingsTabsPresenter {
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}

export function useSettingsTabsPresenter(
  initialTab: SettingsTab = "profile",
): SettingsTabsPresenter {
  const [activeTab, setActiveTabState] = useState<SettingsTab>(initialTab);

  const setActiveTab = useCallback((tab: SettingsTab) => {
    setActiveTabState(tab);
  }, []);

  return { activeTab, setActiveTab };
}
