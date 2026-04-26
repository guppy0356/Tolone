import { memo } from "react";
import { useLoginPresenter } from "./Login.presenter";
import type { LoginFacade } from "./Login.facade";

interface LoginViewProps {
  submit: LoginFacade["submit"];
  isPending: boolean;
  error: Error | null;
  onLoggedIn: () => void;
}

const LoginView = memo(function LoginView({
  submit,
  isPending,
  error,
  onLoggedIn,
}: LoginViewProps) {
  const { email, password, setEmail, setPassword, handleSubmit } =
    useLoginPresenter({ submit, onLoggedIn });

  return (
    <div className="mx-auto mt-16 max-w-sm p-4">
      <h1 className="mb-6 text-2xl font-bold">Login</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            Login failed. Try again.
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
});

export interface LoginComponentProps extends LoginFacade {
  onLoggedIn: () => void;
}

export function LoginComponent({
  submit,
  isPending,
  error,
  onLoggedIn,
}: LoginComponentProps) {
  return (
    <LoginView
      submit={submit}
      isPending={isPending}
      error={error}
      onLoggedIn={onLoggedIn}
    />
  );
}
