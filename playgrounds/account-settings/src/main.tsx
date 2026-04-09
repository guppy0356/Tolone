import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { useSettingsTabsPresenter } from "./features/settings-tabs/SettingsTabs.presenter";
import { SettingsTabsNav } from "./features/settings-tabs/SettingsTabs.component";
import { useProfileSettingsFacade } from "./features/profile-settings/ProfileSettings.facade";
import { ProfileSettingsComponent } from "./features/profile-settings/ProfileSettings.component";
import { useNotificationSettingsFacade } from "./features/notification-settings/NotificationSettings.facade";
import { NotificationSettingsComponent } from "./features/notification-settings/NotificationSettings.component";
import "./app.css";

const queryClient = new QueryClient();

function ProfileSettingsContainer() {
  const facade = useProfileSettingsFacade();
  return <ProfileSettingsComponent {...facade} />;
}

function NotificationSettingsContainer() {
  const facade = useNotificationSettingsFacade();
  return <NotificationSettingsComponent {...facade} />;
}

function SettingsPage() {
  const { activeTab, setActiveTab } = useSettingsTabsPresenter();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Settings</h1>
      <SettingsTabsNav activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "profile" ? (
        <ProfileSettingsContainer />
      ) : (
        <NotificationSettingsContainer />
      )}
    </div>
  );
}

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([indexRoute]);
const router = createRouter({ routeTree });

async function enableMocking() {
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
