import { useCallback, useState } from "react";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookFormSchema, type BookFormValues } from "./Book.schema";
import type { BookContainerState } from "./Book.container.hook";

export interface BookComponentParams {
  registerBook: BookContainerState["registerBook"];
}

export interface BookFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string | undefined;
}

export interface BookComponentState {
  isbn13Field: BookFormField;
  canSubmit: boolean;
  isSubmitting: boolean;
  isRegistered: boolean;
  handleSubmit: () => void;
}

export function useBookComponent({
  registerBook,
}: BookComponentParams): BookComponentState {
  const [registered, setRegistered] = useState(false);

  const {
    control,
    handleSubmit: rhfHandleSubmit,
    reset,
    formState: { isValid, isSubmitting, isDirty },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    mode: "onChange",
    defaultValues: { isbn13: "" },
  });

  const isbn13Ctrl = useController({ name: "isbn13", control });
  const isbn13Field: BookFormField = {
    value: isbn13Ctrl.field.value,
    onChange: (value) => isbn13Ctrl.field.onChange(value),
    onBlur: isbn13Ctrl.field.onBlur,
    error: isbn13Ctrl.fieldState.error?.message,
  };

  // The parsed output — `isbn13` arrives already trimmed.
  const onSubmit = useCallback(
    async (values: BookFormValues) => {
      await registerBook(values);
      reset({ isbn13: "" });
      setRegistered(true);
    },
    [registerBook, reset],
  );

  const handleSubmit = useCallback(() => {
    void rhfHandleSubmit(onSubmit)();
  }, [rhfHandleSubmit, onSubmit]);

  return {
    isbn13Field,
    canSubmit: isValid,
    isSubmitting,
    // The confirmation belongs to the registration just made: typing the next
    // ISBN-13 dirties the form that reset cleared, and takes it off screen.
    isRegistered: registered && !isDirty,
    handleSubmit,
  };
}
