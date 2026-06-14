# Desert Technology Handover Videos

This isolated Remotion workspace contains the Desert Technology website handover video package. The approval stage currently includes:

- `00-website-overview-showcase.mp4`
- `01-dashboard-overview.mp4`

The website application is not imported or modified by this workspace.

## Preview

```bash
cd handover-video
npm install
npm run studio
```

Choose `WebsiteOverview` or `DashboardOverview` in Remotion Studio.

## Render

```bash
npm run render:00
npm run render:01
npm run render:samples
```

Rendered MP4 files are written to `out/`.

## Project Map

- `src/Root.tsx`: Main Remotion entry exporting every composition.
- `src/components.tsx`: Reusable branded video components.
- `src/scenes.ts`: Scene order, timing, callouts, and captions.
- `scripts/`: Editable voiceover scripts.
- `public/captions/`: Caption JSON.
- `public/captures/`: Live-site screenshots used in the compositions.
- `public/voiceover/`: Generated narration audio.
- `public/brand/`: Logo and font assets.

## Replace Screenshots

Replace the matching PNG in `public/captures/storefront/` or `public/captures/dashboard/`. Keep the same filename, or update the image path in `src/scenes.ts`.

## Edit Captions And Callouts

Edit scene `caption`, `callout`, and timing values in `src/scenes.ts`. Caption archive JSON files are stored in `public/captions/`.

## Edit Voiceover

Edit the relevant text file in `scripts/`, regenerate its audio, and replace the MP3 in `public/voiceover/`.

The current samples use the local neutral English `Daniel` synthetic voice. A preferred ElevenLabs or other TTS voice can replace these MP3 files later without changing the compositions.

## Update Branding

Brand colours and typography are defined in `src/theme.ts`. Replace `public/brand/desert-tech-logo.svg` to update the logo.
