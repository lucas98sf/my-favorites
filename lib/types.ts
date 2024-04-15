export type Result<T = void> =
    T extends void ? void | {
        status: 'error',
        message: string
    } : {
        status: 'success',
        data: T
    } | {
        status: 'error',
        message: string
    }