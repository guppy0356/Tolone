import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { loginApi, type LoginInput } from "./Login.api";
import { setAuthCookie } from "../../lib/auth-cookie";

export interface LoginFacade {
  submit: (input: LoginInput) => Promise<void>;
  isPending: boolean;
  error: Error | null;
}

export function useLoginFacade(): LoginFacade {
  const mutation = useMutation({
    mutationFn: (input: LoginInput) => loginApi.login(input),
    onSuccess: (data) => {
      setAuthCookie(data.token);
    },
  });

  const submit = useCallback(
    async (input: LoginInput) => {
      await mutation.mutateAsync(input);
    },
    [mutation.mutateAsync],
  );

  return {
    submit,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
