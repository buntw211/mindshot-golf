import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if account has been deleted — do not revive it
    const existing = await this.getUser(userData.id as string);
    if (existing?.deletedAt) {
      return existing;
    }

    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error: any) {
      // If the email uniqueness constraint fails (e.g. email already tied to
      // a different Replit account), retry without the email field so the
      // user can still log in.
      if (error.code === "23505" && error.constraint?.includes("email")) {
        const { email: _email, ...dataWithoutEmail } = userData;
        const [user] = await db
          .insert(users)
          .values({ ...dataWithoutEmail, email: null })
          .onConflictDoUpdate({
            target: users.id,
            set: {
              ...dataWithoutEmail,
              email: null,
              updatedAt: new Date(),
            },
          })
          .returning();
        return user;
      }
      throw error;
    }
  }
}

export const authStorage = new AuthStorage();
