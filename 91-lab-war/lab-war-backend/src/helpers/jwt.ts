import { sign, verify } from "hono/jwt";

export const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function generateToken(payload: {
  userId: number;
  username: string;
}): Promise<string> {
  return await sign(payload, JWT_SECRET);
}

export async function verifyToken(
  token: string
): Promise<{ userId: number; username: string } | null> {
  try {
    const result = await verify(token, JWT_SECRET);
    return result as { userId: number; username: string };
  } catch {
    return null;
  }
}
