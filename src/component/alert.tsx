"use client";

import { Alert } from "flowbite-react";

type alert = {
  message?: string;
  type?: string;
};

export function AlertComponent({ message, type }: alert) {
  return (
    <Alert color={type}>
      <span className="font-medium">Alert!</span> {message}
    </Alert>
  );
}
