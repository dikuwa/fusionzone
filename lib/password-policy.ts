import bcrypt from "bcryptjs";

export const PASSWORD_REUSE_ERROR = "New password must be different from the current password.";

export async function passwordMatchesHash(password: string, passwordHash?: string | null) {
  if (!passwordHash) return false;
  return bcrypt.compare(password, passwordHash);
}
