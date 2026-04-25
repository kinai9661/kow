import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Download, Loader2, RefreshCw, Zap, Image as ImageIcon, User, LogOut, Clock, History } from "lucide-react";

const MODELS = [
  { id: "gptimage-2", name: "GPT Image 2", description: "OpenAI latest", credits: 10 },
  { id: "zimage", name: "ZImage", description: "Enhanced detail", credits: 8 },
  { id: "imagen4", name: "Imagen 4", description: "Google AI", credits: 12 },
  { id: "grok-image", name: "Grok Image", description: "xAI model", credits: 10 },
];

const RATIOS = [
  { id: "landscape", name: "16:9", label: "Landscape" },
  { id: "portrait", name: "9:16", label: "Portrait" },
  { id: "square", name: "1:1", label: "Square" },
];

const STYLES = [
  { id: "none", name: "None", label: "No Style" },
  { id: "photorealistic", name: "Photorealistic", label: "Photorealistic" },
  { id: "anime", name: "Anime", label: "Anime Style" },
  { id: "oil-painting", name: "Oil Painting", label: "Oil Painting" },
  { id: "watercolor", name: "Watercolor", label: "Watercolor" },
  { id: "digital-art", name: "Digital Art", label: "Digital Art" },
  { id: "pencil-sketch", name: "Pencil Sketch", label: "Pencil Sketch" },
  { id: "cyberpunk", name: "Cyberpunk", label: "Cyberpunk" },
  { id: "fantasy", name: "Fantasy", label: "Fantasy" },
  { id: "steampunk", name: "Steampunk", label: "Steampunk" },
];

const TRANSLATIONS = {
  en: {
    title: "Aqua Image Studio",
    subtitle: "AI-Powered Image Generation",
    promptPlaceholder: "Describe your image... A majestic mountain landscape at sunset with golden light, highly detailed, 8K resolution...",
    model: "AI Model",
    ratio: "Aspect Ratio",
    style: "Art Style",
    numberOfImages: "Number of Images",
    generate: "Generate Images",
    generating: "Generating...",
    credits: "Credits",
    remaining: "Remaining",
    uploadReference: "Upload Reference Image",
    noReferenceImage: "No reference image (Text-to-Image)",
    history: "History",
    noHistory: "No generation history yet",
    noImagesYet: "No Images Yet",
    noImagesDesc: "Enter a prompt and click Generate to create AI-powered images",
    download: "Download",
    regenerate: "Regenerate",
    login: "Login",
    register: "Register",
    logout: "Logout",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    createAccount: "Create Account",
    alreadyHaveAccount: "Already have an account? Login",
    noAccount: "Don't have an account? Register",
    wrongCredentials: "Invalid email or password",
    emailRequired: "Email is required",
    passwordRequired: "Password is required",
    passwordsDoNotMatch: "Passwords do not match",
    registrationSuccess: "Registration successful!",
    notEnoughCredits: "Not enough credits",
    processing: "Processing...",
    inQueue: "In Queue",
    position: "Position",
    poweredBy: "Powered by Aqua API",
    welcome: "Welcome",
    recentGenerations: "Recent Generations",
    clearHistory: "Clear History",
  },
  zh: {
    title: "Aqua 圖片工作室",
    subtitle: "AI 驅動圖片生成",
    promptPlaceholder: "描述你的圖片... 雄偉的山景，日落金光，高細節，8K分辨率...",
    model: "AI 模型",
    ratio: "比例",
    style: "藝術風格",
    numberOfImages: "圖片數量",
    generate: "生成圖片",
    generating: "生成中...",
    credits: "積分",
    remaining: "剩餘",
    uploadReference: "上傳參考圖片",
    noReferenceImage: "無參考圖片（文生圖）",
    history: "歷史記錄",
    noHistory: "暫無生成記錄",
    noImagesYet: "還沒有圖片",
    noImagesDesc: "輸入描述並點擊生成來創建 AI 圖片",
    download: "下載",
    regenerate: "重新生成",
    login: "登入",
    register: "註冊",
    logout: "登出",
    email: "電子郵件",
    password: "密碼",
    confirmPassword: "確認密碼",
    createAccount: "創建帳戶",
    alreadyHaveAccount: "已有帳戶？登入",
    noAccount: "沒有帳戶？註冊",
    wrongCredentials: "電子郵件或密碼錯誤",
    emailRequired: "請輸入電子郵件",
    passwordRequired: "請輸入密碼",
    passwordsDoNotMatch: "密碼不一致",
    registrationSuccess: "註冊成功！",
    notEnoughCredits: "積分不足",
    processing: "處理中...",
    inQueue: "排隊中",
    position: "位置",
    poweredBy: "由 Aqua API 驅動",
    welcome: "歡迎",
    recentGenerations: "最近生成",
    clearHistory: "清除歷史",
  },
};

export default function ImageStudio() {
  const [lang, setLang] = useState<"en" | "zh">("zh");
  const t = TRANSLATIONS[lang];
  
  const [user, setUser] = useState<{ email: string; credits: number } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("gptimage-2");
  const [ratio, setRatio] = useState("landscape");
  const [style, setStyle] = useState("none");
  const [count, setCount] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<{ url: string; id: string; time: string }[]>([]);
  const [error, setError] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ prompt: string; model: string; images: string[]; time: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as "en" | "zh" | null;
    if (savedLang) setLang(savedLang);
    
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    
    const savedHistory = localStorage.getItem("history");
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const toggleLang = () => {
    const newLang = lang === "en" ? "zh" : "en";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  const handleAuth = async () => {
    setAuthError("");
    if (!email || !password) {
      setAuthError(lang === "en" ? "Please fill in all fields" : "請填寫所有欄位");
      return;
    }
    
    if (!isLogin && password !== confirmPassword) {
      setAuthError(t.passwordsDoNotMatch);
      return;
    }

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setAuthError(data.error || (lang === "en" ? "Authentication failed" : "認證失敗"));
        return;
      }

      if (isLogin) {
        setToken(data.token);
        setUser({ email, credits: data.credits });
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({ email, credits: data.credits }));
      } else {
        setAuthError(t.registrationSuccess);
        setTimeout(() => setIsLogin(true), 1500);
      }
    } catch {
      setAuthError(lang === "en" ? "Network error" : "網路錯誤");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReferenceImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addToHistory = (prompt: string, model: string, images: string[]) => {
    const newHistory = [
      { prompt, model, images, time: new Date().toLocaleString() },
      ...history.slice(0, 19),
    ];
    setHistory(newHistory);
    localStorage.setItem("history", JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("history");
  };

  const generate = async () => {
    if (!prompt.trim() || !user) return;
    
    const modelInfo = MODELS.find((m) => m.id === model);
    const cost = (modelInfo?.credits || 10) * count;
    
    if (user.credits < cost) {
      setError(t.notEnoughCredits);
      return;
    }

    setGenerating(true);
    setError("");
    setImages([]);
    setQueuePosition(1);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          model,
          ratio,
          style,
        }),
      });

      setQueuePosition(null);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Generation failed");
      }

      const newImages = Array.isArray(data.url) 
        ? data.url.map((url: string, i: number) => ({ url, id: `${Date.now()}-${i}`, time: new Date().toLocaleString() }))
        : [{ url: data.url, id: `${Date.now()}`, time: new Date().toLocaleString() }];
      
      setImages(newImages);
      addToHistory(prompt, model, newImages.map((img) => img.url));

      const newCredits = user.credits - cost;
      setUser({ ...user, credits: newCredits });
      localStorage.setItem("user", JSON.stringify({ ...user, credits: newCredits }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setGenerating(false);
      setQueuePosition(null);
    }
  };

  const downloadImage = (url: string, index: number) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `aqua-image-${Date.now()}-${index + 1}.png`;
    link.click();
  };

  const loadFromHistory = (item: { prompt: string; model: string; images: string[] }) => {
    setPrompt(item.prompt);
    setModel(item.model);
    setImages(item.images.map((url, i) => ({ url, id: `hist-${i}`, time: item.time })));
    setShowHistory(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-900/80 border-slate-800 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">{t.title}</CardTitle>
            <CardDescription className="text-slate-400">{t.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={toggleLang} className="border-slate-700 text-slate-300">
                {lang === "en" ? "中文" : "English"}
              </Button>
            </div>
            
            <div>
              <label className="text-sm text-slate-300 mb-1 block">{t.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="email@example.com"
              />
            </div>
            
            <div>
              <label className="text-sm text-slate-300 mb-1 block">{t.password}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="••••••••"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="text-sm text-slate-300 mb-1 block">{t.confirmPassword}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="••••••••"
                />
              </div>
            )}

            {authError && (
              <p className="text-red-400 text-sm text-center">{authError}</p>
            )}

            <Button
              onClick={handleAuth}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold"
            >
              {isLogin ? t.login : t.register}
            </Button>

            <p className="text-center text-slate-400 text-sm">
              {isLogin ? t.noAccount : t.alreadyHaveAccount}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setAuthError("");
                }}
                className="text-cyan-400 ml-1 hover:underline"
              >
                {isLogin ? t.register : t.login}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/50 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{t.title}</h1>
              <p className="text-xs text-slate-400">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
              <Zap className="w-3 h-3 mr-1" />
              {t.credits}: {user.credits}
            </Badge>
            
            <div className="flex items-center gap-2 text-slate-300">
              <User className="w-4 h-4" />
              <span className="text-sm">{user.email}</span>
            </div>
            
            <Button variant="outline" size="sm" onClick={toggleLang} className="border-slate-700 text-slate-300">
              {lang === "en" ? "中文" : "English"}
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-slate-700 text-slate-300 hover:bg-red-500/10">
              <LogOut className="w-4 h-4 mr-1" />
              {t.logout}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid lg:grid-cols-[1fr,350px] gap-8">
          <div className="space-y-6">
            <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-cyan-400" />
                  {lang === "en" ? "Create Image" : "創建圖片"}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {lang === "en" ? "Enter a detailed description for your AI-generated image" : "輸入詳細描述來生成 AI 圖片"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t.promptPlaceholder}
                    className="w-full h-40 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">{t.model}</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white"
                    >
                      {MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.credits} {t.credits})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">{t.ratio}</label>
                    <select
                      value={ratio}
                      onChange={(e) => setRatio(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white"
                    >
                      {RATIOS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.label})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">{t.style}</label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white"
                    >
                      {STYLES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">{t.uploadReference}</label>
                  <div className="flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-slate-700 text-slate-300"
                    >
                      {referenceImage ? (lang === "en" ? "Change Image" : "更換圖片") : (lang === "en" ? "Select Image" : "選擇圖片")}
                    </Button>
                    {referenceImage && (
                      <div className="relative">
                        <img src={referenceImage} alt="Reference" className="w-16 h-16 object-cover rounded-lg" />
                        <button
                          onClick={() => setReferenceImage(null)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <span className="text-slate-500 text-sm">{referenceImage ? "" : t.noReferenceImage}</span>
                  </div>
                </div>

                <Button
                  onClick={generate}
                  disabled={!prompt.trim() || generating || user.credits < (MODELS.find((m) => m.id === model)?.credits || 10)}
                  className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {queuePosition !== null ? `${t.inQueue} #${queuePosition}` : t.generating}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      {t.generate}
                    </>
                  )}
                </Button>

                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}
              </CardContent>
            </Card>

            {generating && (
              <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm">
                <CardContent className="p-8 flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                  <p className="text-slate-400">
                    {queuePosition !== null ? `${t.inQueue}... #${queuePosition}` : t.processing}
                  </p>
                </CardContent>
              </Card>
            )}

            {images.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{lang === "en" ? "Generated Images" : "已生成圖片"}</h3>
                  <Button onClick={generate} variant="outline" size="sm" className="border-slate-700 text-slate-300">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {t.regenerate}
                  </Button>
                </div>
                <div className="grid gap-4">
                  {images.map((img, index) => (
                    <Card key={img.id} className="bg-slate-900/80 border-slate-800 overflow-hidden">
                      <div className="relative">
                        <img src={img.url} alt={`Generated ${index + 1}`} className="w-full h-auto rounded-lg" />
                        <div className="absolute bottom-3 right-3">
                          <Button
                            onClick={() => downloadImage(img.url, index)}
                            size="sm"
                            className="bg-slate-900/90 hover:bg-slate-800 text-white"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            {t.download}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {!generating && images.length === 0 && !error && (
              <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm">
                <CardContent className="p-12 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                    <ImageIcon className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-300 mb-2">{t.noImagesYet}</h3>
                  <p className="text-slate-500 text-sm max-w-xs">{t.noImagesDesc}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm sticky top-24">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <History className="w-4 h-4 text-cyan-400" />
                    {t.history}
                  </CardTitle>
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearHistory} className="text-slate-400 hover:text-white text-xs">
                      {t.clearHistory}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">{t.noHistory}</p>
                ) : (
                  history.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-slate-800/30 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors"
                      onClick={() => loadFromHistory(item)}
                    >
                      <p className="text-white text-sm line-clamp-2 mb-1">{item.prompt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">{MODELS.find((m) => m.id === item.model)?.name}</span>
                        <span className="text-xs text-slate-600">{item.time}</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {item.images.slice(0, 2).map((url, i) => (
                          <img key={i} src={url} alt="" className="w-12 h-12 object-cover rounded" />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/50 mt-8">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-slate-500">
          <p>{t.poweredBy} • {t.credits}: {user.credits}</p>
        </div>
      </footer>
    </div>
  );
}