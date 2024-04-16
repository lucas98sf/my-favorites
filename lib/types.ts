export type Error = {
  status: "error"
  message: string
  code?: string
}

export type Result<T = null> =
  | {
      status: "success"
      data: T
    }
  | Error
