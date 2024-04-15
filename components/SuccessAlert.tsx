import { CheckIcon } from "@radix-ui/react-icons"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function SuccessAlert({ message }: { message: string }) {
  return (
    <Alert className="text-green-600">
      <CheckIcon color="green" className="h-4 w-4" />
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
