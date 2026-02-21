import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, ChevronDown, ChevronUp, ExternalLink, Copy, Check } from "lucide-react";

const CANVAS_W = 2500;
const CANVAS_H = 1686;
const HALF_H = CANVAS_H / 2;
const HALF_W = CANVAS_W / 2;
const THIRD_W = Math.floor(CANVAS_W / 3);

const topCells = [
  { label: "申請休假", emoji: "📝", bg: "#3B82F6", x: 0, y: 0, w: HALF_W, h: HALF_H },
  { label: "查詢假期", emoji: "📊", bg: "#22C55E", x: HALF_W, y: 0, w: HALF_W, h: HALF_H },
];

const bottomCells = [
  { label: "當月休假", emoji: "📆", bg: "#8B5CF6", x: 0, y: HALF_H, w: THIRD_W, h: HALF_H },
  { label: "休假明細", emoji: "📋", bg: "#6366F1", x: THIRD_W, y: HALF_H, w: THIRD_W, h: HALF_H },
  { label: "網頁版請假", emoji: "🌐", bg: "#F97316", x: THIRD_W * 2, y: HALF_H, w: CANVAS_W - THIRD_W * 2, h: HALF_H },
];

const allCells = [...topCells, ...bottomCells];

const PUBLISHED_URL = "https://your-published-url.lovable.app";

const steps = [
  {
    title: "一、下載選單圖片",
    content: "在本頁上方點擊「下載圖片」取得 line-rich-menu.png（2500×1686 像素）。",
  },
  {
    title: "二、進入 LINE 後台",
    content: "前往 LINE Official Account Manager（manager.line.biz），選擇你的官方帳號。",
    link: "https://manager.line.biz/",
  },
  {
    title: "三、建立圖文選單",
    content: "左側選單點擊「聊天室相關」→「圖文選單」，再點擊「建立」。",
  },
  {
    title: "四、基本設定",
    content:
      "標題：休假系統選單\n使用期間：設定起迄日期（建議設長期）\n選單列顯示文字：點擊開啟選單\n預設顯示：開啟（使用者進入聊天室即顯示）",
  },
  {
    title: "五、選擇版型",
    content: "選擇「大型」→ 上方 2 格 + 下方 3 格（共 5 個區塊）的版型。",
  },
  {
    title: "六、上傳圖片",
    content: "點擊「上傳背景圖片」，選擇剛才下載的 line-rich-menu.png，確認圖片對齊五個區塊。",
  },
  {
    title: "七、設定各區塊動作",
    table: [
      { pos: "左上（申請休假）", type: "文字", value: "申請休假" },
      { pos: "右上（查詢假期）", type: "文字", value: "查詢假期" },
      { pos: "左下（當月休假）", type: "文字", value: "當月休假" },
      { pos: "中下（休假明細）", type: "文字", value: "休假明細" },
      { pos: "右下（網頁版請假）", type: "連結", value: `${PUBLISHED_URL}/request-leave` },
    ],
  },
  {
    title: "八、儲存並發布",
    content: "點擊「儲存」，確認狀態為「使用中」。",
  },
];

function drawCell(ctx: CanvasRenderingContext2D, cell: typeof allCells[number]) {
  const { x, y, w, h, bg, emoji, label } = cell;

  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, "rgba(255,255,255,0.08)");
  grad.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  ctx.font = "180px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, x + w / 2, y + h / 2 - 80);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 90px sans-serif";
  ctx.fillText(label, x + w / 2, y + h / 2 + 100);
}

export default function RichMenuGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showGuide, setShowGuide] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    allCells.forEach((cell) => drawCell(ctx, cell));

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    // Vertical line top row
    ctx.moveTo(HALF_W, 0);
    ctx.lineTo(HALF_W, HALF_H);
    // Horizontal middle
    ctx.moveTo(0, HALF_H);
    ctx.lineTo(CANVAS_W, HALF_H);
    // Vertical lines bottom row
    ctx.moveTo(THIRD_W, HALF_H);
    ctx.lineTo(THIRD_W, CANVAS_H);
    ctx.moveTo(THIRD_W * 2, HALF_H);
    ctx.lineTo(THIRD_W * 2, CANVAS_H);
    ctx.stroke();
  }, []);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "line-rich-menu.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">LINE 圖文選單圖片</h1>
        <p className="text-muted-foreground mt-1">
          生成 2500×1686 的 Rich Menu 圖片，下載後上傳至 LINE 後台
        </p>
      </div>

      <div className="space-y-4">
        <Button onClick={handleDownload} className="gap-2">
          <Download className="h-4 w-4" /> 下載圖片
        </Button>

        <div className="overflow-auto rounded-lg border">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full max-w-3xl"
          />
        </div>
      </div>

      {/* Setup Guide */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setShowGuide(!showGuide)}
        >
          <CardTitle className="flex items-center justify-between text-lg">
            <span>📋 LINE 圖文選單設定步驟</span>
            {showGuide ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </CardTitle>
        </CardHeader>
        {showGuide && (
          <CardContent className="space-y-6 pt-0">
            {steps.map((step, i) => (
              <div key={i} className="space-y-2">
                <h3 className="font-semibold">{step.title}</h3>
                {step.content && (
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {step.content}
                  </p>
                )}
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    開啟 LINE 後台 <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {step.table && (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium">區塊</th>
                          <th className="px-3 py-2 text-left font-medium">類型</th>
                          <th className="px-3 py-2 text-left font-medium">設定值</th>
                          <th className="px-3 py-2 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {step.table.map((row, j) => (
                          <tr key={j} className="border-t">
                            <td className="px-3 py-2">{row.pos}</td>
                            <td className="px-3 py-2">{row.type}</td>
                            <td className="px-3 py-2 font-mono text-xs break-all">
                              {row.value}
                            </td>
                            <td className="px-3 py-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleCopy(row.value, j)}
                              >
                                {copiedIdx === j ? (
                                  <Check className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 text-sm space-y-1">
              <p className="font-medium text-amber-800 dark:text-amber-200">⚠️ 注意</p>
              <p className="text-amber-700 dark:text-amber-300">
                右下角的網頁連結請在正式上線後替換為你的 Published URL。
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
