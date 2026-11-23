import { useId, useState, type FormEvent } from "react";
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertTitle,
  BrandMark,
  Button,
  Card,
  CardContent,
  CardHeader,
  Disclosure,
  FormField,
  Link,
  PasswordInput,
  Spinner,
} from "@momoi-labs/kiso-react";

/* A sign-in gate with no application shell. `result` stands in for the
   server's answer, so every failure can be shown; a success opens the shop. */
export type LoginResult = "success" | "refused" | "service" | "network";
type LoginErrors = { email?: string; password?: string };

export const loginResults: [LoginResult, string][] = [
  ["success", "Success"],
  ["refused", "Credentials refused"],
  ["service", "Service failure"],
  ["network", "Connection failure"],
];

const loginFailures = {
  refused: ["Email or password not accepted", "Check both and try again, or reset your password."],
  service: ["Tabi & Smoke could not sign you in", "This is a problem on our side. Your details are kept; try again in a moment."],
  network: ["Could not reach Tabi & Smoke", "Check your connection, then try again. Your details are kept."],
} as const;

function LoginBrand() {
  return (
    <div className="brand">
      <BrandMark>✦</BrandMark>
      <div className="layout-login-brand">
        <span className="t-label">Tabi & Smoke</span>
        <span className="t-metadata muted">staff.tabiandsmoke.example</span>
      </div>
    </div>
  );
}

function LoginHelp() {
  return (
    <ul className="layout-login-help stack-sm">
      <li><strong>Forgot your password?</strong> Use Reset password below the form.</li>
      <li><strong>No account yet?</strong> Ask the shop owner to invite your email address.</li>
      <li><strong>Locked out?</strong> Wait 15 minutes after repeated attempts, or ask the shop owner.</li>
    </ul>
  );
}

export function LoginLayout({ result, onSignedIn }: { result: LoginResult; onSignedIn: () => void }) {
  const id = useId();
  const [email, setEmail] = useState("aki@tabiandsmoke.example");
  const [password, setPassword] = useState("quiet-steps");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [failure, setFailure] = useState<Exclude<LoginResult, "success"> | null>(null);
  const [pending, setPending] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const next: LoginErrors = {};
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!/^[^@\s]+@[^@\s]+$/.test(email.trim())) next.email = "Enter an email address like name@example.com.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    setFailure(null);
    if (next.email || next.password) {
      document.getElementById(next.email ? `${id}-email` : `${id}-password`)?.focus();
      return;
    }
    setPending(true);
    window.setTimeout(() => {
      setPending(false);
      if (result === "success") return onSignedIn();
      setFailure(result);
      if (result === "refused") {
        setPassword("");
        document.getElementById(`${id}-password`)?.focus();
      }
    }, 1200);
  }

  return (
    <div className="layout-login">
      <aside className="layout-login-context" aria-labelledby={`${id}-context`}>
        <LoginBrand />
        <div className="stack-sm">
          <h2 className="t-h1" id={`${id}-context`}>Sign in to the back office</h2>
          <p className="muted">Use the email address the shop invited.</p>
        </div>
        <div className="layout-login-context-help stack-sm">
          <h3 className="t-h3">Trouble signing in?</h3>
          <LoginHelp />
        </div>
      </aside>
      <section className="layout-login-access" aria-labelledby={`${id}-title`}>
        <div className="layout-login-panel stack">
          <div className="layout-login-mobile"><LoginBrand /></div>
          <Card>
            <CardHeader>
              <h3 className="t-h3" id={`${id}-title`}>Sign in</h3>
            </CardHeader>
            <CardContent>
              <form className="stack" noValidate aria-busy={pending} onSubmit={submit}>
                {failure ? (
                  <Alert variant="error">
                    <AlertContent>
                      <AlertTitle>{loginFailures[failure][0]}</AlertTitle>
                      <AlertDescription>{loginFailures[failure][1]}</AlertDescription>
                    </AlertContent>
                  </Alert>
                ) : null}
                <FormField id={`${id}-email`} label="Email address" type="email" name="email"
                  autoComplete="username" autoCapitalize="none" spellCheck={false} required
                  readOnly={pending} value={email} error={errors.email}
                  onChange={event => { setEmail(event.target.value); setErrors(e => ({ ...e, email: undefined })); }} />
                <FormField label="Password" error={errors.password}>
                  <PasswordInput id={`${id}-password`} name="password" required readOnly={pending}
                    value={password}
                    onChange={event => { setPassword(event.target.value); setErrors(e => ({ ...e, password: undefined })); }} />
                </FormField>
                <Button type="submit" variant="primary" aria-busy={pending}>
                  {pending ? <Spinner size="sm" /> : null}
                  {pending ? "Signing in..." : "Sign in"}
                </Button>
                <Link href="#example/login">Reset password</Link>
                <Disclosure className="layout-login-mobile" summary="Trouble signing in?">
                  <LoginHelp />
                </Disclosure>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
