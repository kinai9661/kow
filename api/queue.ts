import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "aqua-studio-secret-key-2024";
const API_KEY = "aqua_sk_24dd0b35d58c407685912dd7ed1fe5cd";
const BASE_URL = "https://api.aquadevs.com";

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
  email: string;
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

// Global state for serverless
const users = new Map<string, User>();
const queue: QueueItem[] = [];
let processing = false;

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function verifyToken(token: string): { userId: string } | null {
  try {
    return verify(token, JWT_SECRET) as { userId: string };
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
  
  for (const user of users.values()) {
    if (user.id === decoded.userId) return user;
  }
  return null;
}

// Cost per generation
const MODEL_COSTS: Record<string, number> = {
  "gptimage-2": 1,
  "zimage": 1,
  "imagen4": 2,
  "grok-image": 1,
};

// POST /api/queue/generate
async function handleGenerate(req: VercelRequest, res: VercelResponse) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "請先登入" });
  }
  
  const { prompt, model = "gptimage-2", ratio = "square", imageUrl } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "請填寫提示詞" });
  }
  
  const cost = MODEL_COSTS[model] || 1;
  
  if (user.credits < cost) {
    return res.status(400).json({ error: `積分不足！需要 ${cost} 積分，你只有 ${user.credits} 積分` });
  }
  
  // Deduct credits
  user.credits -= cost;
  
  // Add to queue
  const queueItem: QueueItem = {
    id: generateId(),
    userId: user.id,
    email: user.email,
    prompt,
    model,
    ratio,
    imageUrl,
    status: "pending",
    createdAt: Date.now(),
  };
  
  queue.push(queueItem);
  
  // Start processing if not already
  if (!processing) {
    processQueue();
  }
  
  return res.status(200).json({
    success: true,
    queueId: queueItem.id,
    position: queue.length,
    remainingCredits: user.credits,
    message: "已加入生成隊列"
  });
}

// GET /api/queue/status
async function handleStatus(req: VercelRequest, res: VercelResponse) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "請先登入" });
  }
  
  const { queueId } = req.query;
  
  const userQueue = queue.filter(item => item.userId === user.id);
  
  if (queueId) {
    const item = queue.find(q => q.id === queueId && q.userId === user.id);
    if (!item) {
      return res.status(404).json({ error: "找不到這個生成任務" });
    }
    return res.status(200).json({
      queueId: item.id,
      status: item.status,
      resultUrl: item.resultUrl,
      error: item.error,
      position: queue.filter(q => q.status === "pending" && q.createdAt < item.createdAt).length + 1
    });
  }
  
  return res.status(200).json({
    queue: userQueue.map(item => ({
      queueId: item.id,
      prompt: item.prompt.substring(0, 50) + (item.prompt.length > 50 ? "..." : ""),
      model: item.model,
      status: item.status,
      resultUrl: item.resultUrl,
      error: item.error,
      createdAt: item.createdAt
    })),
    totalInQueue: userQueue.length,
    pendingCount: userQueue.filter(q => q.status === "pending" || q.status === "processing").length
  });
}

// Process queue
async function processQueue() {
  processing = true;
  
  while (queue.length > 0) {
    const item = queue.find(q => q.status === "pending");
    if (!item) break;
    
    item.status = "processing";
    
    try {
      const requestBody: Record<string, any> = {
        model: item.model,
        prompt: item.prompt,
        ratio: item.ratio,
      };
      
      if (item.imageUrl) {
        requestBody.image = item.imageUrl;
      }
      
      const response = await fetch(`${BASE_URL}/v1/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      if (data.success && data.url) {
        item.status = "completed";
        item.resultUrl = data.url;
        item.completedAt = Date.now();
      } else {
        item.status = "failed";
        item.error = data.error || "生成失敗";
      }
    } catch (error: any) {
      item.status = "failed";
      item.error = error.message || "生成失敗";
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  processing = false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  try {
    if (req.method === "POST") {
      return handleGenerate(req, res);
    } else if (req.method === "GET") {
      return handleStatus(req, res);
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Queue error:", error);
    return res.status(500).json({ error: "服務器錯誤" });
  }
}