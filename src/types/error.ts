export function HttpError(message: string, code: number) {
  const err = new Error(message) as Error & { code: number };
  err.statusCode = code;
  return err;
}
