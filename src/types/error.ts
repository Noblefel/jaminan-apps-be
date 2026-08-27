export function HttpError(message: string, code: number) {
  const err = new Error(message) as Error & { code: number };
  err.code = code;
  return err;
}
