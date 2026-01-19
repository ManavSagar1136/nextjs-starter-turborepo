import * as React from "react";
import { X, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Slider } from "./slider";

export interface ImageCropperProps {
  src: string;
  onCrop: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  className?: string;
}

export function ImageCropper({ src, onCrop, onCancel, aspectRatio = 1, className }: ImageCropperProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to crop area
    canvas.width = 200;
    canvas.height = 200 / aspectRatio;

    // Calculate crop area
    const cropSize = Math.min(200, 200 / aspectRatio);
    const sourceX = (image.width - cropSize) / 2;
    const sourceY = (image.height - cropSize * aspectRatio) / 2;

    // Draw cropped image
    ctx.drawImage(image, sourceX, sourceY, cropSize, cropSize * aspectRatio, 0, 0, canvas.width, canvas.height);

    const croppedImageUrl = canvas.toDataURL("image/png");
    onCrop(croppedImageUrl);
  };

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black/80", className)}>
      <div className="bg-background mx-4 w-full max-w-2xl rounded-lg p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Crop Image</h3>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative mb-4">
          <div
            className="border-primary relative cursor-move overflow-hidden rounded-lg border-2"
            style={{ aspectRatio }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={src}
              alt="Crop preview"
              className="h-full w-full object-cover"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: "center",
              }}
              onLoad={() => {
                // Center the image initially
                if (imageRef.current) {
                  const img = imageRef.current;
                  setPosition({
                    x: (img.offsetWidth - img.naturalWidth * scale) / 2,
                    y: (img.offsetHeight - img.naturalHeight * scale) / 2,
                  });
                }
              }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Zoom</label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setScale(Math.max(0.5, scale - 0.1))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Slider
                value={[scale]}
                onValueChange={([value]) => setScale(value)}
                min={0.5}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={() => setScale(Math.min(3, scale + 0.1))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Rotation</label>
            <Button variant="outline" size="sm" onClick={() => setRotation((rotation + 90) % 360)}>
              <RotateCw className="mr-2 h-4 w-4" />
              Rotate 90°
            </Button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleCrop}>Crop Image</Button>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
