import { useState, useCallback } from "react";
import type { LoginFacade } from "./Login.facade";

export interface LoginPresenterProps {
  submit: LoginFacade["submit"];
  onLoggedIn: () => void;
}

export interface LoginPresenter {
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  handleSubmit: () => Promise<void>;
}

export function useLoginPresenter({
  submit,
  onLoggedIn,
}: LoginPresenterProps): LoginPresenter {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = useCallback(async () => {
    try {
      await submit({ email, password });
    } catch {
      return;
    }
    onLoggedIn();
  }, [email, password, submit, onLoggedIn]);

  return {
    email,
    password,
    setEmail,
    setPassword,
    handleSubmit,
  };
}
