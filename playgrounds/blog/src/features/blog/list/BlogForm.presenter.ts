import { useCallback } from "react";
import { useForm, useController } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBlogSchema, type CreateBlogFormValues } from "../Blog.schema";
import type { CreateBlogInput } from "../Blog.api";

export interface BlogFormPresenterProps {
  addBlog: (input: CreateBlogInput) => Promise<void>;
}

export interface BlogFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string | undefined;
}

export interface BlogFormPresenter {
  titleField: BlogFormField;
  contentField: BlogFormField;
  handleSubmit: () => Promise<void>;
  isValid: boolean;
}

export function useBlogFormPresenter({
  addBlog,
}: BlogFormPresenterProps): BlogFormPresenter {
  const {
    control,
    handleSubmit: rhfHandleSubmit,
    reset,
    formState: { isValid },
  } = useForm<CreateBlogFormValues>({
    resolver: zodResolver(createBlogSchema),
    mode: "onChange",
    defaultValues: { title: "", content: "" },
  });

  const titleCtrl = useController({ name: "title", control });
  const contentCtrl = useController({ name: "content", control });

  const titleField: BlogFormField = {
    value: titleCtrl.field.value,
    onChange: (v: string) => titleCtrl.field.onChange(v),
    onBlur: titleCtrl.field.onBlur,
    error: titleCtrl.fieldState.error?.message,
  };

  const contentField: BlogFormField = {
    value: contentCtrl.field.value ?? "",
    onChange: (v: string) => contentCtrl.field.onChange(v),
    onBlur: contentCtrl.field.onBlur,
    error: contentCtrl.fieldState.error?.message,
  };

  const onSubmit = useCallback(
    async (data: CreateBlogFormValues) => {
      await addBlog({
        title: data.title,
        content: data.content || undefined,
      });
      reset();
    },
    [addBlog, reset],
  );

  const handleSubmit = useCallback(
    () => rhfHandleSubmit(onSubmit)(),
    [rhfHandleSubmit, onSubmit],
  );

  return { titleField, contentField, handleSubmit, isValid };
}
