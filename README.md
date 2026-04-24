# Aqua Image Studio

專業 AI 圖片生成網站，部署在 Vercel。

## 一鍵部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project)

手動部署：
1. 下載源碼上傳到 GitHub
2. 在 Vercel Import Project
3. 使用默認配置即可（無需設置環境變量）

## 功能

- 6 種 AI 模型：Flux 2, GPT Image 2, Imagen 4, NanoBanana, ZImage, Midjourney 7
- 5 種尺寸比例：1:1, 3:2, 2:3, 16:9, 9:16
- 生成 1/2/4 張圖片
- 點擊下載 / 重新生成

## API

`POST /api/generate`

```json
{
  "prompt": "A beautiful sunset",
  "model": "flux-2",
  "size": "1024x1024",
  "n": 1
}
```

## 本地運行

```bash
npm install
npm run dev
```