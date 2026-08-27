/** Removes the password hash from a User row before it's returned by the API. */
export function stripPassword<T extends { password: string }>(
  user: T,
): Omit<T, 'password'> {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}
