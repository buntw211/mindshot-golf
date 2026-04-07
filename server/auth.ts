import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import authRouter from "./auth";
const router = Router();


type UserRecord = {
  id: number;
  email: string;
  passwordHash: string;
  verified: boolean;
  verifyToken: string | null;
};

const users: UserRecord[] = [];

const IS_PROD = process.env.NODE_ENV === "production";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createPublicUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    verified: user.verified,
  };
}

function setAuthCookie(res: Response, userId: number) {
  res.cookie("userId", String(userId), {
    httpOnly: true,
    sameSite: IS_PROD ? "none" : "lax",
    secure: IS_PROD,
    maxAge: 1000 * 60 * 60 * 24 * 30,
    path: "/",
  });
}

function clearAuthCookie(res: Response) {
  res.clearCookie("userId", {
    httpOnly: true,
    sameSite: IS_PROD ? "none" : "lax",
    secure: IS_PROD,
    path: "/",
  });
}

router.post("/signup", async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email || "");
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!email.includes("@")) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const existing = users.find((u) => u.email === email);
    if (existing) {
      return res.status(400).json({ message: "An account with that email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");

    const user: UserRecord = {
  id: Date.now(),
  email,
  passwordHash,
  verified: true,
  verifyToken: null,
};

    users.push(user);

    console.log(`VERIFY LINK: https://mindshotgolf.com/api/auth/verify/${verifyToken}`);

    return res.status(201).json({
      message: "Account created. Check your email to verify your account.",
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Unable to create account" });
  }
});

router.get("/verify/:token", (req: Request, res: Response) => {
  try {
    const token = String(req.params.token || "");
    const user = users.find((u) => u.verifyToken === token);

    if (!user) {
      return res.status(400).send("Invalid or expired verification link.");
    }

    user.verified = true;
    user.verifyToken = null;

    return res.redirect("/login?verified=1");
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).send("Verification failed.");
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email || "");
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = users.find((u) => u.email === email);

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    setAuthCookie(res, user.id);

    return res.json({
      message: "Logged in",
      user: createPublicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Unable to sign in" });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  clearAuthCookie(res);
  return res.json({ message: "Logged out" });
});

router.get("/me", (req: Request, res: Response) => {
  try {
    const userId = req.cookies?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = users.find((u) => String(u.id) === String(userId));

    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.json(createPublicUser(user));
  } catch (error) {
    console.error("Current user error:", error);
    return res.status(500).json({ message: "Unable to get current user" });
  }
});

export default router;