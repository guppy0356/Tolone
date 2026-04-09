import { useCallback, useEffect } from "react";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileFormValues } from "./ProfileSettings.schema";
import type { Profile } from "./ProfileSettings.api";
import type { ProfileSettingsFacade } from "./ProfileSettings.facade";

export interface ProfileSettingsPresenterProps {
  profile: Profile | undefined;
  updateProfile: ProfileSettingsFacade["updateProfile"];
}

export interface ProfileFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string | undefined;
}

export interface ProfileSettingsPresenter {
  nameField: ProfileFormField;
  bioField: ProfileFormField;
  handleSubmit: () => Promise<void>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

export function useProfileSettingsPresenter({
  profile,
  updateProfile,
}: ProfileSettingsPresenterProps): ProfileSettingsPresenter {
  const {
    control,
    handleSubmit: rhfHandleSubmit,
    reset,
    formState: { isValid, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: { name: "", bio: "" },
  });

  useEffect(() => {
    if (profile) {
      reset({ name: profile.name, bio: profile.bio });
    }
  }, [profile, reset]);

  const nameCtrl = useController({ name: "name", control });
  const bioCtrl = useController({ name: "bio", control });

  const nameField: ProfileFormField = {
    value: nameCtrl.field.value,
    onChange: (v) => nameCtrl.field.onChange(v),
    onBlur: nameCtrl.field.onBlur,
    error: nameCtrl.fieldState.error?.message,
  };

  const bioField: ProfileFormField = {
    value: bioCtrl.field.value,
    onChange: (v) => bioCtrl.field.onChange(v),
    onBlur: bioCtrl.field.onBlur,
    error: bioCtrl.fieldState.error?.message,
  };

  const onSubmit = useCallback(
    async (data: ProfileFormValues) => {
      await updateProfile({ name: data.name, bio: data.bio });
      reset({ name: data.name, bio: data.bio });
    },
    [updateProfile, reset],
  );

  const handleSubmit = useCallback(
    () => rhfHandleSubmit(onSubmit)(),
    [rhfHandleSubmit, onSubmit],
  );

  return {
    nameField,
    bioField,
    handleSubmit,
    isValid,
    isDirty,
    isSubmitting,
  };
}
