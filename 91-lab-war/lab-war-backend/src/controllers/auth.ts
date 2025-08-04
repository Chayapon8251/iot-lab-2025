import { Hono } from "hono";
import { jwt } from "hono/jwt";
import * as argon2 from "argon2";
import drizzle from "../db/drizzle";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { generateToken } from "../helpers/jwt";
import { authMiddleware } from "../middleware";

const authRouter = new Hono();

authRouter.post(
  "/login",
  zValidator(
    "json",
    z.object({
      username: z.string().min(3),
      password: z.string().min(6),
    })
  ),
  async (c) => {
    try {
      const { username, password } = c.req.valid("json");

      // Find user by username
      const user = await drizzle
        .select({
          id: users.id,
          username: users.username,
          password: users.password,
          teamId: users.teamId,
        })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (user.length === 0) {
        return c.json({ error: "Invalid username or password" }, 401);
      }

      const userData = user[0];

      // Verify password using Argon2
      const isValidPassword = await argon2.verify(userData.password, password);

      if (!isValidPassword) {
        return c.json({ error: "Invalid username or password" }, 401);
      }

      // Generate JWT token
      const token = await generateToken({
        userId: userData.id,
        username: userData.username,
      });

      return c.json({
        message: "Login successful",
        token,
        user: {
          id: userData.id,
          username: userData.username,
          teamId: userData.teamId,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  }
);

authRouter.get("/me", authMiddleware, async (c) => {
  try {
    const payload = c.get("jwtPayload") as { userId: number; username: string };

    // Get user data from database
    const user = await drizzle.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json(user);
  } catch (error) {
    console.error("Me route error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { authRouter };
