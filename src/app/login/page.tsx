"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiUrl } from "@/lib/env";
import {
  Container,
  Eyebrow,
  Heading,
  Text,
  Field,
  Input,
  Button,
  Divider,
} from "@/design-system";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M533.5 278.4c0-17.4-1.6-34.1-4.7-50.2H272v95h147.1c-6.4 34.6-25.7 63.9-54.8 83.6l88.6 68.9c51.7-47.7 81.6-117.8 81.6-197.3z"
      />
      <path
        fill="#34A853"
        d="M272 544.3c73.6 0 135.4-24.4 180.6-66.2l-88.6-68.9c-24.6 16.5-56.2 26.3-92 26.3-70.7 0-130.6-47.7-152-111.9l-90.6 70.1C65.9 483.6 161 544.3 272 544.3z"
      />
      <path
        fill="#FBBC05"
        d="M120 330.6c-10.6-31.2-10.6-64.9 0-96.1L29.4 164.5C10.7 203.3 0 244.7 0 278.4s10.7 75.1 29.4 113.9L120 330.6z"
      />
      <path
        fill="#EA4335"
        d="M272 109.6c39.9 0 75.9 13.7 104.3 40.9l78.1-78.1C405.9 24.6 345.5 0 272 0 161 0 65.9 60.7 29.4 164.5L120 235.1C141.4 171 201.3 109.6 272 109.6z"
      />
    </svg>
  );
}

export default function CustomerAuthPage() {
  const { login, register, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // login()/register() report their own failures (toast + console.error) and
  // never reject, so there is nothing for a catch here to do -- this only
  // needs to clear the busy state once the attempt settles either way.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(form.email, form.password, "customer");
      } else {
        await register?.(
          { email: form.email, password: form.password, name: form.name },
          "customer"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || loading;

  return (
    <div className="mak flex min-h-screen items-center justify-center bg-mak-bg px-5 py-16">
      <Container size="narrow" className="max-w-md !px-0">
        <div className="border-2 border-mak-line p-8 md:p-10">
          <Link href="/" className="mb-8 flex flex-col items-center gap-3 no-underline">
            <span className="font-display text-mak-heading font-extrabold tracking-[-0.02em] text-mak-ink">
              MAK<span className="text-mak-accent">WATCHES</span>
            </span>
            <Eyebrow tone="accent">Account</Eyebrow>
          </Link>

          <Heading level="title" as="h1" className="mb-2 text-center">
            {isLogin ? "Welcome back" : "Create your account"}
          </Heading>
          <Text tone="muted" className="mb-8 text-center">
            {isLogin ? "Sign in to continue" : "Join MAK Watches today"}
          </Text>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {!isLogin && (
              <Field label="Name" required>
                <Input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </Field>
            )}

            <Field label="Email" required>
              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Password" required>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
              />
            </Field>

            <Button type="submit" variant="primary" size="lg" block disabled={busy}>
              {busy ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <Divider className="flex-1" weight="hairline" />
            <Text size="micro" tone="subtle">
              or
            </Text>
            <Divider className="flex-1" weight="hairline" />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            block
            iconLeft={<GoogleIcon />}
            onClick={() => {
              window.location.href = apiUrl("/auth/google");
            }}
          >
            Continue with Google
          </Button>

          <div className="mt-8 text-center">
            <Text size="small" tone="muted" as="span">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </Text>
            <button
              type="button"
              className="font-display text-mak-small font-extrabold text-mak-accent underline-offset-4 hover:underline"
              onClick={() => {
                setIsLogin((v) => !v);
                setForm({ email: "", password: "", name: "" });
              }}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </div>

          <Divider className="mt-6" weight="hairline" />
          <Text size="small" tone="subtle" className="mt-4 text-center">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </Text>
        </div>
      </Container>
    </div>
  );
}
