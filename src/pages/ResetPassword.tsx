import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ResetPassword = () => {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Check Your Email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We've sent a password reset link to your email. Please check your inbox and follow the instructions.
          </p>
          <div className="mt-8 space-y-3">
            <Button variant="accent" className="w-full" asChild>
              <Link to="/login">Return to Sign In</Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setSubmitted(false)}
            >
              Try a different email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-base font-bold text-primary-foreground">OP</span>
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">OdooPulse</span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Reset your account password
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg border bg-card p-8 shadow-sm">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 mx-auto">
            <Mail className="h-6 w-6 text-accent" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </p>
            </div>

            <Button type="submit" variant="accent" className="w-full">
              Send Reset Link
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
