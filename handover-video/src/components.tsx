import type {CSSProperties, ReactNode} from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {fontFamily, theme} from "./theme";

const enter = (frame: number, fps: number, delay = 0) =>
  interpolate(frame, [delay, delay + fps * 0.55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

export const Background = ({children}: {children: ReactNode}) => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(circle at 86% 12%, rgba(246,137,35,.15), transparent 30%), linear-gradient(135deg, #fffdf9 0%, #f4efe8 100%)",
      color: theme.ink,
      fontFamily,
    }}
  >
    <AbsoluteFill
      style={{
        opacity: 0.25,
        backgroundImage:
          "linear-gradient(rgba(36,33,29,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(36,33,29,.08) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
        maskImage: "linear-gradient(to bottom, black, transparent 76%)",
      }}
    />
    {children}
  </AbsoluteFill>
);

export const BrandMark = ({compact = false}: {compact?: boolean}) => (
  <div style={{display: "flex", alignItems: "center", gap: compact ? 14 : 22}}>
    <div
      style={{
        width: compact ? 52 : 82,
        height: compact ? 52 : 82,
        borderRadius: compact ? 14 : 22,
        background: theme.white,
        boxShadow: "0 16px 50px rgba(36,33,29,.12)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Img
        src={staticFile("brand/desert-tech-logo.svg")}
        style={{width: compact ? 42 : 68, height: compact ? 42 : 68, objectFit: "contain"}}
      />
    </div>
    <div>
      <div style={{fontWeight: 800, fontSize: compact ? 26 : 40, letterSpacing: -1}}>
        Desert Technology
      </div>
      <div
        style={{
          color: theme.orangeDark,
          fontWeight: 700,
          fontSize: compact ? 12 : 16,
          letterSpacing: 2.3,
          textTransform: "uppercase",
        }}
      >
        Technology Consultants
      </div>
    </div>
  </div>
);

export const VideoIntro = ({
  title,
  subtitle,
  episode,
}: {
  title: string;
  subtitle: string;
  episode: string;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = enter(frame, fps);
  return (
    <Background>
      <div style={{position: "absolute", inset: 110, display: "flex", flexDirection: "column", justifyContent: "center"}}>
        <div style={{opacity: progress, transform: `translateY(${(1 - progress) * 34}px)`}}>
          <BrandMark />
          <div
            style={{
              marginTop: 74,
              color: theme.orangeDark,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            {episode}
          </div>
          <h1 style={{fontSize: 82, lineHeight: 1.04, letterSpacing: -4, maxWidth: 1200, margin: "18px 0 22px"}}>
            {title}
          </h1>
          <p style={{fontSize: 30, color: theme.muted, margin: 0, maxWidth: 1100, lineHeight: 1.45}}>{subtitle}</p>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: `${interpolate(frame, [fps * 0.3, fps * 1.4], [0, 390], {extrapolateRight: "clamp"})}px`,
            height: 8,
            borderRadius: 999,
            background: theme.orange,
          }}
        />
      </div>
    </Background>
  );
};

export const SectionTitle = ({eyebrow, title, body}: {eyebrow?: string; title: string; body?: string}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = enter(frame, fps);
  return (
    <Background>
      <div
        style={{
          position: "absolute",
          inset: 130,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          opacity: progress,
          transform: `translateY(${(1 - progress) * 28}px)`,
        }}
      >
        <BrandMark compact />
        {eyebrow ? (
          <div style={{marginTop: 70, color: theme.orangeDark, fontWeight: 800, fontSize: 18, letterSpacing: 3, textTransform: "uppercase"}}>
            {eyebrow}
          </div>
        ) : null}
        <h2 style={{fontSize: 78, letterSpacing: -3.5, lineHeight: 1.05, maxWidth: 1320, margin: "18px 0 24px"}}>{title}</h2>
        {body ? <p style={{fontSize: 29, lineHeight: 1.5, color: theme.muted, maxWidth: 1150, margin: 0}}>{body}</p> : null}
      </div>
    </Background>
  );
};

export const BrowserFrame = ({
  image,
  url,
  zoom = 1,
  panX = 0,
  panY = 0,
  children,
}: {
  image: string;
  url: string;
  zoom?: number;
  panX?: number;
  panY?: number;
  children?: ReactNode;
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const p = enter(frame, fps);
  const drift = interpolate(frame, [0, durationInFrames], [0, 1], {extrapolateRight: "clamp"});
  const scale = zoom + drift * 0.035;
  return (
    <Background>
      <div
        style={{
          position: "absolute",
          inset: "70px 80px 120px",
          borderRadius: 28,
          background: theme.white,
          border: `1px solid ${theme.line}`,
          boxShadow: "0 28px 90px rgba(36,33,29,.18)",
          overflow: "hidden",
          opacity: p,
          transform: `translateY(${(1 - p) * 24}px)`,
        }}
      >
        <div style={{height: 62, background: theme.soft, display: "flex", alignItems: "center", gap: 11, padding: "0 22px", borderBottom: `1px solid ${theme.line}`}}>
          <span style={dotStyle("#ef6a5f")} />
          <span style={dotStyle("#f1bd4e")} />
          <span style={dotStyle("#63c075")} />
          <div style={{marginLeft: 18, flex: 1, height: 34, borderRadius: 999, background: theme.white, border: `1px solid ${theme.line}`, color: theme.muted, display: "flex", alignItems: "center", padding: "0 18px", fontSize: 14}}>
            {url}
          </div>
        </div>
        <div style={{position: "absolute", inset: "62px 0 0", overflow: "hidden", background: theme.soft}}>
          <Img
            src={staticFile(image)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
            }}
          />
          {children}
        </div>
      </div>
    </Background>
  );
};

const dotStyle = (background: string): CSSProperties => ({width: 13, height: 13, borderRadius: "50%", background});

export const CalloutBox = ({
  text,
  x = 70,
  y = 80,
}: {
  text: string;
  x?: number;
  y?: number;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = enter(frame, fps, fps * 0.45);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        maxWidth: 470,
        padding: "20px 24px",
        borderRadius: 18,
        background: "rgba(20,18,15,.92)",
        color: theme.white,
        fontSize: 22,
        lineHeight: 1.35,
        fontWeight: 650,
        boxShadow: "0 18px 50px rgba(0,0,0,.22)",
        borderLeft: `7px solid ${theme.orange}`,
        opacity: p,
        transform: `translateY(${(1 - p) * 18}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const CursorHighlight = ({x, y}: {x: number; y: number}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pulse = interpolate(frame % (fps * 1.4), [0, fps * 0.7, fps * 1.4], [0.75, 1.2, 0.75]);
  return (
    <div style={{position: "absolute", left: x, top: y, width: 64, height: 64, borderRadius: "50%", border: `4px solid ${theme.orange}`, background: "rgba(246,137,35,.18)", transform: `scale(${pulse})`, boxShadow: "0 0 0 12px rgba(246,137,35,.08)"}} />
  );
};

export const StepCard = ({step, title, detail}: {step: string; title: string; detail: string}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = enter(frame, fps, fps * 0.4);
  return (
    <div style={{position: "absolute", right: 115, top: 150, width: 510, borderRadius: 24, background: "rgba(255,253,249,.96)", border: `1px solid ${theme.line}`, boxShadow: "0 25px 70px rgba(36,33,29,.18)", padding: 34, opacity: p, transform: `translateX(${(1 - p) * 24}px)`}}>
      <div style={{color: theme.orangeDark, fontSize: 15, fontWeight: 850, letterSpacing: 2.4, textTransform: "uppercase"}}>{step}</div>
      <div style={{fontSize: 34, fontWeight: 800, marginTop: 12, letterSpacing: -1}}>{title}</div>
      <div style={{fontSize: 21, color: theme.muted, lineHeight: 1.45, marginTop: 12}}>{detail}</div>
    </div>
  );
};

export const CaptionBar = ({text}: {text: string}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = enter(frame, fps, fps * 0.25);
  return (
    <div style={{position: "absolute", left: 150, right: 150, bottom: 28, display: "flex", justifyContent: "center", opacity: p}}>
      <div style={{background: "rgba(20,18,15,.93)", color: theme.white, fontSize: 24, fontWeight: 650, lineHeight: 1.35, padding: "15px 25px", borderRadius: 16, borderBottom: `4px solid ${theme.orange}`, textAlign: "center", boxShadow: "0 12px 35px rgba(0,0,0,.18)"}}>
        {text}
      </div>
    </div>
  );
};

export const Outro = ({line}: {line: string}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = enter(frame, fps);
  return (
    <Background>
      <div style={{position: "absolute", inset: 110, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", opacity: p}}>
        <BrandMark />
        <h2 style={{fontSize: 68, letterSpacing: -3, margin: "70px 0 20px"}}>Desert Technology Website Handover</h2>
        <p style={{fontSize: 29, color: theme.muted, margin: 0}}>{line}</p>
        <div style={{marginTop: 65, color: theme.orangeDark, fontSize: 17, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase"}}>
          desertechnam.vercel.app · +264 85 277 5140
        </div>
        <div style={{position: "absolute", bottom: 0, color: theme.muted, fontSize: 15}}>Prepared by Martin Mukoya / FlexTech Media</div>
      </div>
    </Background>
  );
};
