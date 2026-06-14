import {Audio} from "@remotion/media";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {staticFile} from "remotion";
import {
  BrowserFrame,
  CalloutBox,
  CaptionBar,
  Outro,
  SectionTitle,
  VideoIntro,
} from "./components";
import {dashboardOverviewScenes, websiteOverviewScenes} from "./scenes";
import type {VisualScene} from "./types";

const Scene = ({scene}: {scene: VisualScene}) => {
  if (scene.kind === "intro") {
    return <VideoIntro title={scene.title} subtitle={scene.body ?? ""} episode={scene.eyebrow ?? ""} />;
  }
  if (scene.kind === "section") {
    return <SectionTitle eyebrow={scene.eyebrow} title={scene.title} body={scene.body} />;
  }
  if (scene.kind === "outro") {
    return <Outro line={scene.body ?? ""} />;
  }
  return (
    <BrowserFrame
      image={scene.image ?? ""}
      url={scene.image?.startsWith("captures/dashboard") ? "desertechnam.vercel.app/dashboard" : "desertechnam.vercel.app"}
      zoom={scene.zoom}
      panX={scene.panX}
      panY={scene.panY}
    >
      {scene.callout ? <CalloutBox text={scene.callout} x={scene.calloutX} y={scene.calloutY} /> : null}
      {scene.caption ? <CaptionBar text={scene.caption} /> : null}
    </BrowserFrame>
  );
};

const SceneSeries = ({scenes}: {scenes: VisualScene[]}) => (
  <TransitionSeries>
    {scenes.map((scene, index) => (
      <TransitionSeries.Sequence key={scene.id} durationInFrames={scene.duration} premountFor={30}>
        <Scene scene={scene} />
        {index === scenes.length - 1 ? null : undefined}
      </TransitionSeries.Sequence>
    )).flatMap((sequence, index, all) =>
      index === all.length - 1
        ? [sequence]
        : [
            sequence,
            <TransitionSeries.Transition
              key={`transition-${index}`}
              presentation={fade()}
              timing={linearTiming({durationInFrames: 15})}
            />,
          ],
    )}
  </TransitionSeries>
);

export const WebsiteOverview = () => (
  <>
    <SceneSeries scenes={websiteOverviewScenes} />
    <Audio src={staticFile("voiceover/00-website-overview/voiceover.mp3")} volume={1} />
  </>
);

export const DashboardOverview = () => (
  <>
    <SceneSeries scenes={dashboardOverviewScenes} />
    <Audio src={staticFile("voiceover/01-dashboard-overview/voiceover.mp3")} volume={1} />
  </>
);
