"use client";

import { useState, useMemo, useCallback, useEffect, type MouseEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, ImageIcon, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromotionImageGalleryProps {
  images?: string[];
  imageUrl?: string;
  title: string;
  variant?: "card" | "detail";
  className?: string;
  maxPreview?: number;
}

export function PromotionImageGallery({
  images,
  imageUrl,
  title,
  variant = "card",
  className,
  maxPreview = 5,
}: PromotionImageGalleryProps) {
  const allImages = useMemo(() => {
    const list = images && images.length > 0 ? images : imageUrl ? [imageUrl] : [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const url of list) {
      if (!url || seen.has(url)) continue;
      seen.add(url);
      out.push(url);
    }
    return out;
  }, [images, imageUrl]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const isOpen = activeIndex !== null;

  const closeLightbox = useCallback(() => setActiveIndex(null), []);
  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i === null ? i : (i - 1 + allImages.length) % allImages.length));
  }, [allImages.length]);
  const goNext = useCallback(() => {
    setActiveIndex((i) => (i === null ? i : (i + 1) % allImages.length));
  }, [allImages.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, goPrev, goNext]);

  const isDetail = variant === "detail";

  if (allImages.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground/40",
          isDetail ? "h-[320px] sm:h-[420px] lg:h-[480px]" : "h-[240px] sm:h-[300px]",
          className,
        )}
      >
        <ImageIcon className="h-10 w-10" />
        <span className="text-xs font-medium">Image unavailable</span>
      </div>
    );
  }

  if (allImages.length === 1) {
    return (
      <div className={cn("w-full", className)}>
        <GalleryImage
          src={allImages[0]}
          alt={title}
          index={0}
          onOpen={setActiveIndex}
          className={isDetail ? "h-[320px] sm:h-[420px] lg:h-[480px]" : "h-[240px] sm:h-[300px]"}
        />
        <Lightbox
          open={isOpen}
          images={allImages}
          title={title}
          index={activeIndex ?? 0}
          onOpenChange={(o) => { if (!o) closeLightbox(); }}
          onSelect={setActiveIndex}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>
    );
  }

  if (isDetail) {
    return (
      <div className={cn("w-full", className)}>
        <GalleryImage
          src={allImages[0]}
          alt={title}
          index={0}
          onOpen={setActiveIndex}
          className="h-[320px] sm:h-[420px] lg:h-[480px]"
        />
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {allImages.slice(1).map((src, i) => (
            <Thumb
              key={`${src}-${i}`}
              src={src}
              index={i + 1}
              title={title}
              onOpen={setActiveIndex}
              className="aspect-square"
            />
          ))}
        </div>
        <Lightbox
          open={isOpen}
          images={allImages}
          title={title}
          index={activeIndex ?? 0}
          onOpenChange={(o) => { if (!o) closeLightbox(); }}
          onSelect={setActiveIndex}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>
    );
  }

  // Card variant — 2 images
  if (allImages.length === 2) {
    return (
      <div className={cn("grid grid-cols-2 gap-1.5 h-[240px] sm:h-[300px]", className)}>
        <GalleryImage src={allImages[0]} alt={title} index={0} onOpen={setActiveIndex} className="h-full" />
        <GalleryImage src={allImages[1]} alt={`${title} — image 2`} index={1} onOpen={setActiveIndex} className="h-full" />
        <Lightbox
          open={isOpen}
          images={allImages}
          title={title}
          index={activeIndex ?? 0}
          onOpenChange={(o) => { if (!o) closeLightbox(); }}
          onSelect={setActiveIndex}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>
    );
  }

  // Card variant — 3+ images (capped preview with +N overlay)
  const thumbs = allImages.slice(1, maxPreview);
  const extraCount = allImages.length > maxPreview ? allImages.length - maxPreview : 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: stacked hero + thumbnail row */}
      <div className="flex flex-col gap-1.5 sm:hidden">
        <GalleryImage
          src={allImages[0]}
          alt={title}
          index={0}
          onOpen={setActiveIndex}
          className="aspect-[16/10]"
        />
        <div className="grid grid-cols-4 gap-1.5 h-20">
          {thumbs.map((src, i) => (
            <Thumb
              key={`${src}-${i}`}
              src={src}
              index={i + 1}
              title={title}
              onOpen={setActiveIndex}
              extraOverlay={i === thumbs.length - 1 ? extraCount : 0}
            />
          ))}
        </div>
      </div>

      {/* Desktop: hero (2x2) + thumbnail grid */}
      <div className="hidden sm:grid sm:grid-cols-4 sm:grid-rows-2 gap-1.5 h-[280px] lg:h-[320px]">
        <div className="col-span-2 row-span-2 h-full">
          <GalleryImage src={allImages[0]} alt={title} index={0} onOpen={setActiveIndex} className="h-full" />
        </div>
        {thumbs.map((src, i) => (
          <Thumb
            key={`${src}-${i}`}
            src={src}
            index={i + 1}
            title={title}
            onOpen={setActiveIndex}
            extraOverlay={i === thumbs.length - 1 ? extraCount : 0}
          />
        ))}
      </div>

      <Lightbox
        open={isOpen}
        images={allImages}
        title={title}
        index={activeIndex ?? 0}
        onOpenChange={(o) => { if (!o) closeLightbox(); }}
        onSelect={setActiveIndex}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}

function GalleryImage({
  src,
  alt,
  index,
  onOpen,
  className,
}: {
  src: string;
  alt: string;
  index: number;
  onOpen: (idx: number) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className={cn("group relative block w-full overflow-hidden bg-muted", className)}
      aria-label={`Open image preview for ${alt}`}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span className="pointer-events-none absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <Maximize2 className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

function Thumb({
  src,
  index,
  title,
  onOpen,
  extraOverlay = 0,
  className,
}: {
  src: string;
  index: number;
  title: string;
  onOpen: (idx: number) => void;
  extraOverlay?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className={cn("group relative h-full w-full overflow-hidden bg-muted", className)}
      aria-label={extraOverlay > 0 ? `View ${extraOverlay} more images` : `Open image ${index + 1} of ${title}`}
    >
      <img
        src={src}
        alt={`${title} — image ${index + 1}`}
        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
      />
      {extraOverlay > 0 && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm font-bold text-white">
          +{extraOverlay}
        </span>
      )}
    </button>
  );
}

function Lightbox({
  open,
  images,
  title,
  index,
  onOpenChange,
  onSelect,
  onPrev,
  onNext,
}: {
  open: boolean;
  images: string[];
  title: string;
  index: number;
  onOpenChange: (open: boolean) => void;
  onSelect: (idx: number) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const handleContentClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col items-center justify-center outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={handleContentClick}
        >
          <DialogPrimitive.Title className="sr-only">{title} — image preview</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Image {index + 1} of {images.length}. Use arrow keys to navigate, Escape to close.
          </DialogPrimitive.Description>

          <DialogPrimitive.Close
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>

          {images.length > 1 && (
            <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {index + 1} / {images.length}
            </div>
          )}

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-5"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-5"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <img
            src={images[index]}
            alt={`${title} — image ${index + 1}`}
            className="max-h-[74vh] max-w-[92vw] object-contain"
          />

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-20 flex max-w-[94vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-xl bg-black/40 p-2">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  onClick={(e) => { e.stopPropagation(); onSelect(i); }}
                  className={cn(
                    "h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                    i === index ? "border-primary" : "border-transparent opacity-60 hover:opacity-100",
                  )}
                  aria-label={`Go to image ${i + 1}`}
                  aria-current={i === index}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
