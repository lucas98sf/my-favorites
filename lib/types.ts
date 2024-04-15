export type Error = {
  status: "error"
  message: string
  code?: string
}

export type Result<T = void> = T extends void
  ? void | Error
  :
      | {
          status: "success"
          data: T
        }
      | Error
