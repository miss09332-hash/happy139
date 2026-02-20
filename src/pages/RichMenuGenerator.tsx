import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const CANVAS_W = 2500;
const CANVAS_H = 1686;
const HALF_W = CANVAS_W / 2;
const HALF_H = CANVAS_H / 2;

const cells = [
  { label: "申請休假", emoji: "📝", bg: "#3B82F6" },
  { label: "查詢假期", emoji: "📊", bg: "#22C55E" },
  { label: "當月休假", emoji: "📆", bg: "#8B5CF6" },
  { label: "網頁版請假", emoji: "🌐", bg: "#F97316" },
];

export default function RichMenuGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    cells.forEach((cell, i) => {
      const x = (i % 2) * HALF_W;
      const y = Math.floor(i / 2) * HALF_H;

      // background
      ctx.fillStyle = cell.bg;
      ctx.fillRect(x, y, HALF_W, HALF_H);

      // subtle gradient overlay
      const grad = ctx.createLinearGradient(x, y, x, y + HALF_H);
      grad.addColorStop(0, "rgba(255,255,255,0.08)");
      grad.addColorStop(1, "rgba(0,0,0,0.12)");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, HALF_W, HALF_H);

      // emoji
      ctx.font = "180px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cell.emoji, x + HALF_W / 2, y + HALF_H / 2 - 80);

      // label
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 90px sans-serif";
      ctx.fillText(cell.label, x + HALF_W / 2, y + HALF_H / 2 + 100);

      // divider lines
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 4;
    });

    // center lines
    ctx.beginPath();
    ctx.moveTo(HALF_W, 0);
    ctx.lineTo(HALF_W, CANVAS_H);
    ctx.moveTo(0, HALF_H);
    ctx.lineTo(CANVAS_W, HALF_H);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 4;
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

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">LINE 圖文選單圖片</h1>
        <p className="text-muted-foreground mt-1">生成 2500×1686 的 Rich Menu 圖片，下載後上傳至 LINE 後台</p>
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
    </div>
  );
}
