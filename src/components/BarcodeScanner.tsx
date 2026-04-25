import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flashlight, Plus, Minus, Keyboard, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export function BarcodeScanner({ open, onClose, onDetected }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [manual, setManual] = useState("");
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    const reader = new BrowserMultiFormatReader();

    (async () => {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (result && !cancelled) {
              if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                navigator.vibrate?.(60);
              }
              onDetected(result.getText());
              controls.stop();
              onClose();
            }
          }
        );
        controlsRef.current = controls;
      } catch (e: any) {
        setError(
          e?.message ??
            "No se pudo acceder a la cámara. Permite el acceso o usa entrada manual."
        );
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onClose, onDetected]);

  // Apply torch + zoom when video stream is available
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const stream = video.srcObject as MediaStream | null;
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    const caps = (track.getCapabilities?.() ?? {}) as any;
    const constraints: any = {};
    if ("torch" in caps) constraints.torch = torch;
    if ("zoom" in caps && caps.zoom) {
      const min = caps.zoom.min ?? 1;
      const max = caps.zoom.max ?? 4;
      constraints.zoom = Math.min(max, Math.max(min, zoom));
    }
    if (Object.keys(constraints).length) {
      track.applyConstraints({ advanced: [constraints] }).catch(() => undefined);
    }
  }, [torch, zoom, open]);

  const submitManual = () => {
    const code = manual.trim();
    if (code) {
      onDetected(code);
      setManual("");
      setShowManual(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md gap-0 overflow-hidden border-0 bg-black p-0 text-white sm:rounded-3xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="absolute left-0 right-0 top-0 z-10 flex-row items-center justify-between p-4">
          <DialogTitle className="text-base font-semibold text-white">
            Escanear código
          </DialogTitle>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />

          {/* Overlay frame */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-56 w-72">
              {/* corner brackets */}
              <span className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-white rounded-tl-lg" />
              <span className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-white rounded-tr-lg" />
              <span className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <span className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              {/* scanning line */}
              <span className="absolute left-2 right-2 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-scan-line" />
            </div>
          </div>

          {error && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-2xl bg-black/80 p-4 text-center text-sm">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3">
            <button
              onClick={() => setTorch((t) => !t)}
              className={[
                "flex h-12 w-12 items-center justify-center rounded-full border border-white/20 transition-colors",
                torch ? "bg-warning text-warning-foreground" : "bg-white/10 text-white hover:bg-white/20",
              ].join(" ")}
              aria-label="Linterna"
            >
              <Flashlight className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2 py-1">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20"
                onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                aria-label="Reducir zoom"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium tabular-nums">{zoom.toFixed(1)}x</span>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/20"
                onClick={() => setZoom((z) => Math.min(5, z + 0.5))}
                aria-label="Aumentar zoom"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setShowManual((v) => !v)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 hover:bg-white/20"
              aria-label="Entrada manual"
            >
              <Keyboard className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showManual && (
          <div className="flex items-center gap-2 bg-card p-4 text-foreground">
            <Input
              autoFocus
              placeholder="Ingresa el código manualmente"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitManual()}
            />
            <Button onClick={submitManual}>OK</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
