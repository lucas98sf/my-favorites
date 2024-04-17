"use client"
import { ExclamationTriangleIcon } from "@radix-ui/react-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ErrorAlert({ message }: { message?: string }) {
  return (
    <Alert variant="destructive">
      <ExclamationTriangleIcon className="h-5 w-5" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message || "An unknown error occurred. Please try again later."}</AlertDescription>
    </Alert>
  )
}
