import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
const { createClient } = require("@/utils/supabase/server");

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-screen sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center max-w-md p-6 bg-accent/20 rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Sign Up Disabled</h1>
      <p className="mb-4">
        New user registration is disabled for this site.
      </p>
      <p className="mb-6">
        If you are the owner of this website, you can sign in using the link below.
      </p>
      <Link 
        href="/sign-in" 
        className="text-primary hover:text-foreground underline font-medium"
      >
        Go to Sign In
      </Link>
    </div>
  );

      {/*
      <>
        <form className="flex flex-col min-w-64 max-w-64 mx-auto">
          <h1 className="text-2xl font-medium">Sign up</h1>
          <p className="text-sm text text-foreground">
            Already have an account?{" "}
            <Link className="text-primary font-medium underline" href="/sign-in">
              Sign in
            </Link>
          </p>
          <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
            <Label htmlFor="email">Email</Label>
            <Input name="email" placeholder="you@example.com" required />
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              name="password"
              placeholder="Your password"
              minLength={6}
              required
            />
            <SubmitButton formAction={signUpAction} pendingText="Signing up...">
              Sign up
            </SubmitButton>
            <FormMessage message={searchParams} />
          </div>
        </form>
        <SmtpMessage />
      </>
      */}

}
