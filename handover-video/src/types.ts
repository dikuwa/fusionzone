export type Caption = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number | null;
  confidence: number | null;
};

export type VisualScene = {
  id: string;
  duration: number;
  image?: string;
  eyebrow?: string;
  title: string;
  body?: string;
  caption?: string;
  callout?: string;
  calloutX?: number;
  calloutY?: number;
  zoom?: number;
  panX?: number;
  panY?: number;
  kind?: "intro" | "browser" | "section" | "outro";
};
