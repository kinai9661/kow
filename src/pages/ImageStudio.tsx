import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Download, Loader2, RefreshCw, Zap, Image as ImageIcon, Upload, X } from "lucide-react";

const MODELS = [
  { id: "gptimage-2", name: "GPT Image 2", description: "OpenAI 最新圖片生成模型" },
  { id: "zimage", name: "ZImage", description: "增強細節，高質量生成" },
  { id: "imagen4", name: "Imagen 4", description: "Google 圖片生成模型" },
  { id: "grok-image", name: "Grok Image", description: "xAI 圖片生成模型" },
];

const SIZES = [
  { id: "landscape", name: "16:9", desc: "橫向" },
  { id: "portrait", name: "9:16", desc: "縱向" },
  { id: "square", name: "1:1", desc: "方形" },
];

export default function ImageStudio() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("gptimage-2");
  const [size, setSize] = useState("square");
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [seed] = useState(Math.floor(Math.random() * 999999999));
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReferenceImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReferenceImage = () => {
    setReferenceImage(null);
    setReferenceFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    
    setGenerating(true);
    setError("");
    setImages([]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          model, 
          ratio: size,
          image: referenceImage || null,  // Send as base64 data URL
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = "生成失敗";
        try {
          const data = JSON.parse(text);
          errorMsg = data.error || data.message || text;
        } catch {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("無效的服務器響應");
      }

      if (!data.success) {
        throw new Error(data.error || "生成失敗");
      }

      const url = data.url;
      if (url) {
        setImages([url]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "發生錯誤");
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = (url: string, index: number) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `aqua-image-${seed}-${index + 1}.png`;
    link.click();
  };

  const regenerate = () => {
    generate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/50 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Aqua 圖片工作室</h1>
              <p className="text-xs text-slate-400">AI 智能圖片生成</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-slate-400">Aqua API 驅動</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Panel - Controls */}
          <div className="space-y-6">
            <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-cyan-400" />
                  創建圖片
                </CardTitle>
                <CardDescription className="text-slate-400">
                  輸入描述文字或上傳參考圖片，AI 將為你生成獨特的作品
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt Input */}
                <div>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="例如：一隻可愛的貓咪在花園裡玩耍，高質量，8K分辨率..."
                    className="w-full h-40 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  />
                </div>

                {/* Reference Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">參考圖片（可選）</label>
                  {referenceImage ? (
                    <div className="relative inline-block">
                      <img
                        src={referenceImage}
                        alt="Reference"
                        className="max-h-32 rounded-xl border border-slate-700"
                      />
                      <button
                        onClick={removeReferenceImage}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="mt-2 text-sm text-slate-400">
                        已選擇參考圖片（圖生圖模式）
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500/50 transition-colors"
                    >
                      <Upload className="w-8 h-8 mx-auto mb-3 text-slate-500" />
                      <p className="text-slate-400 text-sm">點擊上傳圖片</p>
                      <p className="text-slate-500 text-xs mt-1">支援 JPG, PNG, WebP</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">AI 模型</label>
                  <div className="grid grid-cols-2 gap-3">
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setModel(m.id)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          model === m.id
                            ? "border-cyan-500 bg-cyan-500/10 text-white"
                            : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        <div className="text-sm font-medium">{m.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">圖片比例</label>
                  <div className="flex gap-2">
                    {SIZES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSize(s.id)}
                        className={`flex-1 py-3 rounded-xl border font-medium transition-all ${
                          size === s.id
                            ? "border-cyan-500 bg-cyan-500/10 text-white"
                            : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600"
                        }`}
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-slate-500 ml-1">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={generate}
                  disabled={!prompt.trim() || generating}
                  className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      {referenceImage ? "圖生圖生成" : "文字生圖"}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* API Info Card */}
            <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  API 狀態：已連接
                </div>
                <div className="text-slate-500 text-sm mt-1">
                  端點：api.aquadevs.com
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <Card className="bg-red-900/20 border-red-800/50">
                <CardContent className="p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {generating && (
              <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm">
                <CardContent className="p-12 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                  <p className="text-slate-400">正在創建你的作品...</p>
                  <p className="text-slate-500 text-sm mt-2">這可能需要幾秒鐘</p>
                </CardContent>
              </Card>
            )}

            {/* Generated Images */}
            {!generating && images.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">生成的圖片</h3>
                  <Button onClick={regenerate} variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重新生成
                  </Button>
                </div>
                <div className="grid gap-4">
                  {images.map((url, index) => (
                    <Card key={index} className="bg-slate-900/80 border-slate-800 overflow-hidden">
                      <div className="relative">
                        <img
                          src={url}
                          alt={`Generated image ${index + 1}`}
                          className="w-full h-auto rounded-lg"
                        />
                        <div className="absolute bottom-3 right-3 flex gap-2">
                          <Button
                            onClick={() => downloadImage(url, index)}
                            size="sm"
                            className="bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            下載
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!generating && images.length === 0 && !error && (
              <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-sm">
                <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                    <ImageIcon className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-300 mb-2">還沒有圖片</h3>
                  <p className="text-slate-500 text-sm max-w-xs">
                    輸入描述文字或上傳參考圖片，然後點擊生成按鈕來創建 AI 圖片
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-12">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-slate-500">
          <p>由 Aqua API 驅動 • 使用尖端 AI 模型生成圖片</p>
        </div>
      </footer>
    </div>
  );
}