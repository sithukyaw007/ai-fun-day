# JTC AI Playground

Four browser games for the Microsoft booth at JTC AI & Analytics Day. Fictional estate stories connect Mei's lease/tenant work with Chloe's facilities monitoring. No live JTC systems, AI API keys, sign-in, contact collection, or backend are required.

## Games

| Game | How to play | What it demonstrates |
| --- | --- | --- |
| **Beat the Agent** | Solve one of four estate cases in 60 seconds. Select the answer and cite supporting rows from an in-app messy folder. | Correct, sourced answers beat fast guesses. Prepared references are explicitly not live AI. |
| **Spot the Drift** | Press space or tap the alarm after a sustained threshold crossing. Ignore single spikes. Some rounds stay healthy: wait for all-clear. | Compare your decision with a disclosed three-consecutive-sample detector, not a live AI or building connection. |
| **AI or Aiyoh?** | Judge eight AI/data claims. Play on a phone through the quiz QR and show the result to the host. | Sources, permissions, data freshness, consent, and human oversight. |
| **Singlish to Boardroom** | Pick, type, or optionally say a phrase. Choose the professional rewrite that keeps its meaning. | Useful drafting does not invent facts, promises, approvals, or completed work. |

## Run and build

Use Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

The build type-checks the app, bundles React/TypeScript with Parcel, and inlines all gameplay scripts/styles/content into:

- `dist/index.html`: public site entry point.
- `dist/booth-offline.html` and `bundle.html`: self-contained offline copies of the same application.
- `dist/sw.js`: versioned service worker for subsequent offline visits.

No CDN scripts, remote fonts, image assets, QR services, or runtime AI API calls are used. Open `bundle.html` directly for a cold-start offline laptop copy; microphone, clipboard, and service-worker features may be unavailable in local-file mode. Core games still work.

For a release preview that reproduces the GitHub Pages project subpath:

```sh
node scripts/serve-release.mjs
# http://127.0.0.1:49741/ai-fun-day/
```

## Booth operation

1. Keep **Beat the Agent** on the laptop. The opening route defaults to it.
2. Open `#/join` on the host's phone and display the quiz QR. Visitors use their own internet connection, play, and show their result. `#/quiz` opens the quiz directly.
3. Use **Singlish to Boardroom** for facilitated conversations and **Spot the Drift** to change the pace.
4. Close with: **"The officer decides. Copilot did the legwork."**

Use the in-app **Host guide & privacy** page for operation and reset instructions. Start a new round between visitors; changing game cancels an unfinished attempt. A hidden tab cancels an active drift round without saving a score.

### Offline readiness

Open the public site online once and wait for **Offline copy cached on this device** before disconnecting. All gameplay stays in the cached HTML. A downloaded standalone HTML copy does not require an initial cache or local server.

First-time QR visitors still need connectivity. A downloaded file on the laptop does not serve phones. Download the standalone copy while online, before the event; keep it on the laptop. New cached releases are offered explicitly, and the update button is disabled during an active round.

### Live Copilot handoff

This app does **not** connect to Copilot, Fabric, Foundry, or a language-model API. After a case, expand **Try a genuinely live Copilot comparison**, copy the complete fictional source pack, and paste it into your existing, approved Copilot session/account.

Verify the answer and citations. Any operator stopwatch includes the copy/paste handoff, is not a benchmark, and does not enter the leaderboard. Never attribute a simulated or prepared answer's speed to a live agent.

For Singlish, offline rewrites exist only for the eight phrase cards. Punctuation/case/spacing differences are normalised, but unmatched text does not receive a fake generated answer. Edit the transcript, select a preset, or copy it to the optional live handoff.

### Microphone

Voice is a progressive enhancement using browser speech recognition, requested only after explicit opt-in and a Start voice click. The browser may need internet and process audio through its provider. The app does not record/store audio or save transcripts in scores or browser storage.

Recognition prefers `en-SG` and may be unsupported, denied, or transcribe a phrase differently. Review/edit the transcript before finding a match. Typed/preset play always remains available. Recognition stops on navigation, cancellation, round completion, or the voice timeout.

Rehearse microphone permissions, Singapore-English recognition, and the approved signed-in Copilot account on the actual booth hardware. Automated tests mock those services; they cannot establish the host's account policy or real microphone availability.

### Scores and privacy

Scores use generated labels such as `Player 001`. The latest 200 attempts are stored only in this browser under `jtc-playground-results-v1`; each variant has a top-ten view. Beat the Agent complete, on-time, evidenced answers rank before practice attempts. Different cases/phrases/sensors are kept separate.

Phones never sync scores to the laptop. Results and replay are informal and not tamper-proof; public source includes answer keys. No real names, email, webcam, app analytics, or lead list are collected. Storage denial is explicitly reported and leaves session-only play available.

Clear scores through **Local scores > Clear this device's scores**, then confirm. Clear each used device independently after the event. Browser speech and a manually used external Copilot session have their own provider processing policies. GitHub Pages may retain standard access/security logs.

All people, tenants, documents, amounts and sensor readings in the games are fictional. Thresholds and impact lines are illustrative game rules, not operational or safety advice. The source presentation is not included in the repository or release.

## Checks

```sh
npm test
npm run build
npm run lint
npm run test:e2e
```

If Playwright reports that its browser is missing, install Chromium with `npx playwright install chromium` and rerun. Browser checks cover the four evidence cases, quiz scoring, drift controls/all-clear, voice consent/errors/cleanup, QR image decoding, standalone/cached offline use, storage failures, mobile overflow, and accessibility.

## GitHub Pages

The release is published from a dedicated **`gh-pages`** branch; the source work branch and repository default branch are not merged or changed automatically.

Set `site.config.json` to the actual verified Pages URL after Pages has been enabled. This embeds the public URL in the downloadable copy so it can also display the correct quiz QR. Without a configured URL, the hosted page derives its own public HTTPS base; a local preview refuses to generate a misleading localhost QR.

```sh
npm run build
npm run deploy -- -m "Publish JTC AI Playground release"
```

Only the contents of `dist/` are published. Enable Pages with `gh-pages` and `/` as the publishing source. Making a private repository public is a separate, explicit publication decision; it must not be automated as part of the build.

The public site's exact URL and launch links are recorded here after successful deployment.

## Implementation

React, TypeScript, Vite development server, Parcel/HTML inlining, Lucide icons, and local QR generation. The required Clawpilot design tokens provide light/dark presentation, including the `?scoutTheme=light` or `?scoutTheme=dark` override. Browser routes use hashes to work under a Pages project path without rewrites.

Content lives in `src/data/`; scoring, detection, sharing, and prompt formatting are pure helpers in `src/lib/`. A service worker caches only the self-contained entry point under this project's scope. No external runtime data is fetched.
