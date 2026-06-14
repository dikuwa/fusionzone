import {Composition, Folder} from "remotion";
import {dashboardOverviewScenes, totalFrames, websiteOverviewScenes} from "./scenes";
import {DashboardOverview, WebsiteOverview} from "./videos";

const fps = 30;

export const RemotionRoot = () => (
  <Folder name="Approval-Samples">
    <Composition
      id="WebsiteOverview"
      component={WebsiteOverview}
      durationInFrames={totalFrames(websiteOverviewScenes)}
      fps={fps}
      width={1920}
      height={1080}
    />
    <Composition
      id="DashboardOverview"
      component={DashboardOverview}
      durationInFrames={totalFrames(dashboardOverviewScenes)}
      fps={fps}
      width={1920}
      height={1080}
    />
  </Folder>
);
