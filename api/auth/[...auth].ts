import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://zdgrhbmlxxigyiticudo.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_ZMfk_RIx4sbhC4Xmy0to-Q_YFKY2Yxh";
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathname = req.query.pathname as string;
  const method = req.method;
  
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (pathname === "register") {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const { data: existing } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const { data, error } = await supabase
        .from("users")
        .insert([{ email, password, credits: 10 }])
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        user: { email: data.email, credits: data.credits }
      });

    } else if (pathname === "login") {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single();

      if (error || !data) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      return res.status(200).json({
        success: true,
        token: `token_${data.id}_${Date.now()}`,
        user: { email: data.email, credits: data.credits }
      });

    } else {
      return res.status(404).json({ error: "Not found" });
    }

  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
