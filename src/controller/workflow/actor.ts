export type Actor<T> = (state: T) => Promise<T> | T
