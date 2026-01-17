"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SignInStep = "email" | { email: string };

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/";
  // Prevent open redirect - only allow relative paths
  const redirect = redirectParam.startsWith("/") && !redirectParam.startsWith("//")
    ? redirectParam
    : "/";
  const [step, setStep] = useState<SignInStep>("email");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      await signIn("resend-otp", formData);
      setStep({ email });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send verification code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await signIn("resend-otp", formData);
      if (result?.signingIn) {
        router.push(redirect);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid verification code");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in to ISE Residencies</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your student email to receive a sign-in code"
              : "Enter the 8-digit code sent to your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Student Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="12345678@studentmail.ul.ie"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending code..." : "Send verification code"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Only ISE students with approved emails can sign in.
              </p>
            </form>
          ) : (
            <form key="code-form" onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  Verification Code
                </label>
                <Input
                  key="code-input"
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="12345678"
                  required
                  disabled={isLoading}
                  autoComplete="one-time-code"
                  autoFocus
                  defaultValue=""
                />
                <input type="hidden" name="email" value={step.email} />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Sign in"}
              </Button>
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep("email");
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  Use a different email
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
