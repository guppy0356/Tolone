import { memo } from "react";
import { useProfileSettingsPresenter } from "./ProfileSettings.presenter";
import type { ProfileSettingsFacade } from "./ProfileSettings.facade";
import type { Profile } from "./ProfileSettings.api";

interface ProfileSettingsViewProps {
  profile: Profile;
  updateProfile: ProfileSettingsFacade["updateProfile"];
}

const ProfileSettingsView = memo(function ProfileSettingsView({
  profile,
  updateProfile,
}: ProfileSettingsViewProps) {
  const {
    nameField,
    bioField,
    handleSubmit,
    isValid,
    isDirty,
    isSubmitting,
  } = useProfileSettingsPresenter({ profile, updateProfile });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="profile-name"
          className="mb-1 block text-sm font-medium"
        >
          Name
        </label>
        <input
          id="profile-name"
          type="text"
          value={nameField.value}
          onChange={(e) => nameField.onChange(e.target.value)}
          onBlur={nameField.onBlur}
          className="w-full rounded border px-3 py-2"
        />
        {nameField.error && (
          <p className="mt-1 text-sm text-red-500">{nameField.error}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="profile-bio"
          className="mb-1 block text-sm font-medium"
        >
          Bio
        </label>
        <textarea
          id="profile-bio"
          value={bioField.value}
          onChange={(e) => bioField.onChange(e.target.value)}
          onBlur={bioField.onBlur}
          rows={4}
          className="w-full rounded border px-3 py-2"
        />
        {bioField.error && (
          <p className="mt-1 text-sm text-red-500">{bioField.error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid || !isDirty || isSubmitting}
        className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Save"}
      </button>
    </form>
  );
});

export function ProfileSettingsComponent({
  profile,
  isPending,
  isFetching,
  updateProfile,
}: ProfileSettingsFacade) {
  if (isPending || !profile) {
    return <ProfileSettingsSkeleton />;
  }

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-70" : ""}`}>
      <ProfileSettingsView profile={profile} updateProfile={updateProfile} />
    </div>
  );
}

function ProfileSettingsSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading profile">
      <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
      <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
      <div className="h-24 w-full animate-pulse rounded bg-gray-200" />
      <div className="h-10 w-20 animate-pulse rounded bg-gray-200" />
    </div>
  );
}
