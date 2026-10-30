export type Intent = "sign-in" | "sign-up";

// The password phase appears for any account that carries a password, which Clerk reports
// per user. It offers the code as an escape hatch, because an account that grew a password
// otherwise loses email codes entirely. Clerk's Device Trust then challenges that password
// from an unrecognised device and emails a code, which is the "second-factor" code mode.
export type CodeMode = Intent | "second-factor";
export type Phase = { name: "email" } | { name: "code"; mode: CodeMode } | { name: "password" };

export type FlowCopy = { title: string; body: string; submitLabel: string };
export type IntentSwap = { to: Intent; prompt: string; label: string };

export type SignInFlowOptions = { intent: Intent; onSignedIn: () => void };

export type SignInFlow = {
  phase: Phase;
  email: string;
  setEmail: (value: string) => void;
  code: string;
  setCode: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string | null;
  busy: boolean;
  canSendEmailCodeInstead: boolean;
  copy: FlowCopy;
  swap: IntentSwap;
  submit: () => Promise<void>;
  sendCode: () => Promise<void>;
  verifyCode: () => Promise<void>;
  signInWithPassword: () => Promise<void>;
  resendCode: () => Promise<void>;
  sendEmailCodeInstead: () => Promise<void>;
  continueWithGoogle: () => Promise<void>;
  continueWithApple: () => Promise<void>;
  backToEmail: () => void;
};
