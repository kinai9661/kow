import type { VercelRequest, VercelResponse } from "@vercel/node";

const BASE_URL = "https://api.aquadevs.com";
const API_KEY = "aqua_sk_24dd0b35d58c407685912dd7ed1fe5cd";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, model = "flux-2", ratio = "square" } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Check if there's an image file
    const imageUrl = req.body.image || null;
    
    const requestBody: Record<string, any> = {
      model,
      prompt,
      ratio,
    };
    
    // Add image URL if provided
    if (imageUrl) {
      requestBody.image = imageUrl;
    }

    const response = await fetch(`${BASE_URL}/v1/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        success: false, 
        error: `Aqua API error: ${response.status} ${errorText}` 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Image generation error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}