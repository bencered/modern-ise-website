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
import { checkOtpRateLimitWithIp } from "./actions";

type SignInStep = "email" | { email: string };

// Parse error messages and return user-friendly versions
function getErrorMessage(error: unknown, context: "email" | "code"): string {
  const message = error instanceof Error ? error.message : String(error);

  // Rate limit errors (already user-friendly)
  if (message.includes("Too many")) {
    return message;
  }

  // Email not on allowlist
  if (message.includes("not authorized") || message.includes("Only ISE students")) {
    return "This email is not registered as an ISE student. Please use your student email address.";
  }

  // Invalid or expired verification code
  if (
    message.includes("Invalid") ||
    message.includes("invalid") ||
    message.includes("expired") ||
    message.includes("Could not verify")
  ) {
    return "Invalid or expired verification code. Please check the code or request a new one.";
  }

  // Email required
  if (message.includes("Email is required")) {
    return "Please enter your email address.";
  }

  // Network/fetch errors
  if (message.includes("fetch") || message.includes("network") || message.includes("Network")) {
    return "Connection error. Please check your internet and try again.";
  }

  // Resend API errors (usually JSON formatted)
  if (message.startsWith("{") || message.includes("statusCode")) {
    return "Failed to send verification email. Please try again later.";
  }

  // Context-specific fallbacks
  if (context === "email") {
    return "Failed to send verification code. Please try again.";
  }

  return "Verification failed. Please try again.";
}

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
      // Check rate limits before sending OTP (includes IP-based limiting)
      await checkOtpRateLimitWithIp(email);

      await signIn("resend-otp", formData);
      setStep({ email });
    } catch (err) {
      setError(getErrorMessage(err, "email"));
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
      setError(getErrorMessage(err, "code"));
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
