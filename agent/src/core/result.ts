export type Result<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: string };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <T = never>(error: string): Result<T> => ({ ok: false, error });

export const mapResult = <T, U>(result: Result<T>, transform: (value: T) => U): Result<U> =>
  result.ok ? ok(transform(result.value)) : result;

export const flatMapResult = <T, U>(result: Result<T>, next: (value: T) => Result<U>): Result<U> =>
  result.ok ? next(result.value) : result;
