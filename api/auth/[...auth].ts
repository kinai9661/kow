import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hash, compare } from "bcrypt";
import { sign, verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "aqua-studio-secret-key-2024";
const DB_FILE = "/tmp/aqua-users.json";

// In-memory store (for Vercel serverless)
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  credits: number;
  isAdmin: boolean;
  createdAt: number;
  lastLogin: number;
}

interface QueueItem {
  id: string;
  userId: string;
  prompt: string;
  model: string;
  ratio: string;
  imageUrl?: string;
  status: "pending" | "processing" | "completed" | "failed";
  resultUrl?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

const users = new Map<string, User>();
const sessions = new Map<string, string>(); // session -> userId
const queue: QueueItem[] = [];
let processing = false;

function getClientIP(req: VercelRequest): string {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() 
    || (req.headers["x-real-ip"] as string) 
    || "unknown";
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

async function hashPassword(password: string): Promise<string> {
  const salt = await hash(password, 10);
  return salt;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

function createToken(userId: string): string {
  return sign({ userId, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 }, JWT_SECRET);
}

function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

function getAuthUser(req: VercelRequest): User | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return null;
  return users.get(decoded.userId) || null;
}

// POST /api/auth/register
async function handleRegister(req: VercelRequest, res: VercelResponse) {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: "請填寫所有欄位" });
  }
  
  if (users.has(email)) {
    return res.status(400).json({ error: "此 Email 已被註冊" });
  }
  
  const hashedPassword = await hashPassword(password);
  const user: User = {
    id: generateId(),
    email,
    password: hashedPassword,
    name,
    credits: 10, // 免費註冊贈送積分
    isAdmin: email === "admin@aqua.ai",
    createdAt: Date.now(),
    lastLogin: Date.now(),
  };
  
  users.set(email, user);
  
  const token = createToken(user.id);
  return res.status(200).json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, credits: user.credits, isAdmin: user.isAdmin }
  });
}

// POST /api/auth/login
async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "請填寫 Email 和密碼" });
  }
  
  const user = users.get(email);
  if (!user) {
    return res.status(401).json({ error: "Email 或密碼錯誤" });
  }
  
  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Email 或密碼錯誤" });
  }
  
  user.lastLogin = Date.now();
  const token = createToken(user.id);
  
  return res.status(200).json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, credits: user.credits, isAdmin: user.isAdmin }
  });
}

// GET /api/auth/me
async function handleMe(req: VercelRequest, res: VercelResponse) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "請先登入" });
  }
  
  return res.status(200).json({
    user: { id: user.id, email: user.email, name: user.name, credits: user.credits, isAdmin: user.isAdmin }
  });
}

// POST /api/auth/credits (add credits - admin only)
async function handleAddCredits(req: VercelRequest, res: VercelResponse) {
  const user = getAuthUser(req);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: "需要管理員權限" });
  }
  
  const { email, amount } = req.body;
  const targetUser = users.get(email);
  if (!targetUser) {
    return res.status(404).json({ error: "用戶不存在" });
  }
  
  targetUser.credits += amount;
  return res.status(200).json({ success: true, credits: targetUser.credits });
}

// GET /api/auth/users (admin only)
async function handleGetUsers(req: VercelRequest, res: VercelResponse) {
  const user = getAuthUser(req);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: "需要管理員權限" });
  }
  
  const userList = Array.from(users.values()).map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    credits: u.credits,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt,
    lastLogin: u.lastLogin
  }));
  
  return res.status(200).json({ users: userList });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  const path = req.query.path as string[];
  
  try {
    if (path[0] === "register") {
      return handleRegister(req, res);
    } else if (path[0] === "login") {
      return handleLogin(req, res);
    } else if (path[0] === "me") {
      return handleMe(req, res);
    } else if (path[0] === "credits" && req.method === "POST") {
      return handleAddCredits(req, res);
    } else if (path[0] === "users" && path[1] === undefined) {
      return handleGetUsers(req, res);
    }
    
    return res.status(404).json({ error: "Not found" });
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({ error: "服務器錯誤" });
  }
}