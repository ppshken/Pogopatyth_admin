
import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import React from "react";

interface LoginProps {
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function Login({ email, setEmail, password, setPassword, loading, onSubmit }: LoginProps) {
  return (
    <form className="flex max-w-md flex-col gap-4" onSubmit={onSubmit}>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="email1">Your email</Label>
        </div>
        <TextInput
          id="email1"
          type="email"
          placeholder="name@flowbite.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <div className="mb-2 block">
          <Label htmlFor="password1">Your password</Label>
        </div>
        <TextInput
          id="password1"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="remember" />
        <Label htmlFor="remember">Remember me</Label>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Loading..." : "Submit"}
      </Button>
    </form>
  );
}
