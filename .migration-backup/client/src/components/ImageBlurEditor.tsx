import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Eye, EyeOff, Undo2, Check, Trash2 } from "lucide-react";

interface BlurRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageBlurEditorProps {
  imageSrc: string;
  open: boolean;
  onClose: () => void;
  onSave: (blurredImageBase64: string) => void;
}

function clampRegion(region: BlurRegion, maxW: number, maxH: number): BlurRegion {
  const x = Math.max(0, Math.min(region.x, maxW));
  const y = Math.max(0, Math.min(region.y, maxH));
  const width = Math.min(region.width, maxW - x);
  const height = Math.min(region.height, maxH - y);
  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
}

function applyPixelation(ctx: CanvasRenderingContext2D, region: BlurRegion, pixelSize: number) {
  if (region.width < 2 || region.height < 2) return;

  const imageData = ctx.getImageData(region.x, region.y, region.width, region.height);
  const data = imageData.data;
  const w = region.width;
  const h = region.height;

  for (let py = 0; py < h; py += pixelSize) {
    for (let px = 0; px < w; px += pixelSize) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let dy = 0; dy < pixelSize && py + dy < h; dy++) {
        for (let dx = 0; dx < pixelSize && px + dx < w; dx++) {
          const idx = ((py + dy) * w + (px + dx)) * 4;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      for (let dy = 0; dy < pixelSize && py + dy < h; dy++) {
        for (let dx = 0; dx < pixelSize && px + dx < w; dx++) {
          const idx = ((py + dy) * w + (px + dx)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
        }
      }
    }
  }

  ctx.putImageData(imageData, region.x, region.y);
}

export default function ImageBlurEditor({ imageSrc, open, onClose, onSave }: ImageBlurEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [regions, setRegions] = useState<BlurRegion[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<BlurRegion | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [blurStrength, setBlurStrength] = useState<"medium" | "strong">("strong");
  const imgRef = useRef<HTMLImageElement | null>(null);
  const scaleRef = useRef(1);

  const loadImage = useCallback(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (open) {
      setRegions([]);
      setCurrentRect(null);
      setImageLoaded(false);
      setBlurStrength("strong");
      loadImage();
    }
  }, [open, loadImage]);

  useEffect(() => {
    if (!imageLoaded || !imgRef.current || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const img = imgRef.current;

    const containerWidth = container.clientWidth;
    const maxHeight = window.innerHeight * 0.55;

    const scale = Math.min(containerWidth / img.width, maxHeight / img.height, 1);
    scaleRef.current = scale;

    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    drawCanvas();
  }, [imageLoaded]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = scaleRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const allRegions = currentRect ? [...regions, currentRect] : regions;

    for (const region of allRegions) {
      const scaled = clampRegion(
        { x: region.x * scale, y: region.y * scale, width: region.width * scale, height: region.height * scale },
        canvas.width,
        canvas.height
      );

      if (scaled.width < 2 || scaled.height < 2) continue;

      const pixelSize = blurStrength === "strong" ? 12 : 7;
      applyPixelation(ctx, scaled, pixelSize);

      ctx.strokeStyle = "rgba(239, 68, 68, 0.7)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(scaled.x, scaled.y, scaled.width, scaled.height);
      ctx.setLineDash([]);
    }
  }, [regions, currentRect, blurStrength]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const getImageCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scale = scaleRef.current;
    let clientX: number, clientY: number;

    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const img = imgRef.current;
    const maxX = img ? img.width : canvas.width / scale;
    const maxY = img ? img.height : canvas.height / scale;

    return {
      x: Math.max(0, Math.min((clientX - rect.left) / scale, maxX)),
      y: Math.max(0, Math.min((clientY - rect.top) / scale, maxY)),
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getImageCoords(e);
    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentRect(null);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPoint) return;
    e.preventDefault();
    const coords = getImageCoords(e);
    setCurrentRect({
      x: Math.min(startPoint.x, coords.x),
      y: Math.min(startPoint.y, coords.y),
      width: Math.abs(coords.x - startPoint.x),
      height: Math.abs(coords.y - startPoint.y),
    });
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentRect) {
      setIsDrawing(false);
      setStartPoint(null);
      return;
    }

    if (currentRect.width > 5 && currentRect.height > 5) {
      setRegions((prev) => [...prev, currentRect]);
    }

    setCurrentRect(null);
    setIsDrawing(false);
    setStartPoint(null);
  };

  const handleUndo = () => {
    setRegions((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setRegions([]);
  };

  const handleSave = () => {
    const img = imgRef.current;
    if (!img) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = img.width;
    exportCanvas.height = img.height;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    const pixelSize = blurStrength === "strong" ? 16 : 10;

    for (const region of regions) {
      const clamped = clampRegion(region, img.width, img.height);
      if (clamped.width < 2 || clamped.height < 2) continue;
      applyPixelation(ctx, clamped, pixelSize);
    }

    const blurredBase64 = exportCanvas.toDataURL("image/jpeg", 0.85);
    onSave(blurredBase64);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg w-[95vw] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <EyeOff className="w-5 h-5" />
            Flouter des zones
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Dessinez des rectangles sur les visages ou objets a masquer
          </p>
        </DialogHeader>

        <div className="px-4 pb-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={blurStrength === "medium" ? "default" : "outline"}
            size="sm"
            onClick={() => setBlurStrength("medium")}
            data-testid="button-blur-medium"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Flou leger
          </Button>
          <Button
            type="button"
            variant={blurStrength === "strong" ? "default" : "outline"}
            size="sm"
            onClick={() => setBlurStrength("strong")}
            data-testid="button-blur-strong"
          >
            <EyeOff className="w-3.5 h-3.5 mr-1.5" />
            Flou fort
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={regions.length === 0}
            data-testid="button-blur-undo"
          >
            <Undo2 className="w-3.5 h-3.5 mr-1.5" />
            Annuler
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={regions.length === 0}
            data-testid="button-blur-clear"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Tout effacer
          </Button>
        </div>

        <div ref={containerRef} className="px-4 pb-2 flex justify-center">
          {imageLoaded ? (
            <canvas
              ref={canvasRef}
              className="border rounded-md cursor-crosshair touch-none max-w-full"
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              data-testid="canvas-blur-editor"
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Chargement de l'image...
            </div>
          )}
        </div>

        {regions.length > 0 && (
          <p className="px-4 text-xs text-muted-foreground">
            {regions.length} zone{regions.length > 1 ? "s" : ""} selectionnee{regions.length > 1 ? "s" : ""}
          </p>
        )}

        <DialogFooter className="p-4 pt-2 flex flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            data-testid="button-blur-cancel"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={regions.length === 0}
            className="flex-1"
            data-testid="button-blur-save"
          >
            <Check className="w-4 h-4 mr-2" />
            Appliquer ({regions.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
