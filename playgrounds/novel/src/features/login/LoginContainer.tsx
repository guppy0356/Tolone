import { useNavigate } from "@tanstack/react-router";
import { useLoginFacade } from "./Login.facade";
import { LoginComponent } from "./Login.component";

export function LoginContainer() {
  const facade = useLoginFacade();
  const navigate = useNavigate();

  const onLoggedIn = () => {
    navigate({ to: "/" });
  };

  return <LoginComponent {...facade} onLoggedIn={onLoggedIn} />;
}
