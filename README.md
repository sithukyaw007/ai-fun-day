# JTC AI Playground

Four browser games for the Microsoft booth at JTC AI & Analytics Day. Fictional estate stories connect Mei's lease/tenant work with Chloe's facilities monitoring. The hosted app uses a dedicated Azure scoreboard for shared nicknames and best scores; all games also work in device-only mode. No live JTC systems, AI API keys, sign-in, or contact collection is required.

## Launch links

| Use | Link |
| --- | --- |
| Laptop main game | [Beat the Agent](https://sithukyaw007.github.io/ai-fun-day/#/beat) |
| Host's phone | [Quiz QR display](https://sithukyaw007.github.io/ai-fun-day/#/join) |
| Visitors' phones | [AI or Aiyoh? quiz](https://sithukyaw007.github.io/ai-fun-day/#/quiz) |
| All four games | [Game gallery](https://sithukyaw007.github.io/ai-fun-day/#/home) |
| Cold-start laptop backup | [Download the standalone HTML](https://sithukyaw007.github.io/ai-fun-day/booth-offline.html) |
| Operating notes | [Host guide and privacy](https://sithukyaw007.github.io/ai-fun-day/#/host) |
| Nickname leaderboard | [Shared booth leaderboard](https://sithukyaw007.github.io/ai-fun-day/#/scores) |

## Games

| Game | How to play | What it demonstrates |
| --- | --- | --- |
| **Beat the Agent** | Solve one of four estate cases in 60 seconds. Select the answer and cite supporting rows from an in-app messy folder. | Correct, sourced answers beat fast guesses. Prepared references are explicitly not live AI. |
| **Spot the Drift** | Tap the large on-screen alarm pad with a finger after a sustained threshold crossing. No keyboard needed; space is optional. Ignore single spikes. Healthy rounds reward waiting for all-clear. | Compare your decision with a disclosed three-consecutive-sample detector, not a live AI or building connection. |
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

### Surface Go / touchscreen play

Open **Spot the Drift** in Edge or Chrome on the Surface Go. Choose the sensor and tap **Watch the sensor**. After nickname check-in and the skippable guide, the page brings the sensor chart and a full-width, finger-friendly **Raise the alarm** pad into view.

Tap the pad with one finger when you spot sustained drift. No touch bar, trackpad or keyboard is required. Mouse clicks, pen taps and the optional spacebar shortcut still use the same scoring path. The chart itself does not raise an alarm, so a touch or scroll outside the pad is not counted as a reaction. Native tap/click activation and the single-finish guard prevent a single gesture from recording multiple scores. Healthy rounds still require waiting without tapping.

The tablet layout keeps the chart and pad together in landscape and portrait. OS display scaling and browser controls affect available space; use landscape or hide browser chrome if the screen feels cramped.

### Player check-in and visual play

Before the first round, a check-in screen asks for an optional name/nickname. Prefer a nickname; blank input or the guest button creates a guest label. The game clock starts only after check-in is complete. Use **Next player** between visitors: it resets the game and opens a fresh check-in rather than reusing the previous visitor's name. Changing player is disabled during an active round.

The current player is kept in memory only and forgotten on reload. Each device checks in independently, and changing player does not change anyone else's screen. Online check-in explicitly discloses public nickname/score sharing before creating a short-lived player session. **Play on this device only** remains available. Replaying under the same player keeps only their best result per case; identical nicknames are not merged or treated as account credentials.

Beat the Agent opens visual service maps, tenant cards, status checklists, bid bars and lease-calendar cards instead of spreadsheet tables. Pin a card to cite its exact source row; **Read original source** expands the unabridged evidence. Quiz questions and Singlish scenarios have local inline illustrations, and drift gameplay includes the plant/room alongside the live chart. Longer mission briefs, reasoning and quiz explanations are available on demand. No image or diagram service is contacted.

### Short animated gameplay guides

Each player sees a three-step silent walkthrough before starting each game for the first time. The walkthrough demonstrates the controls with separate practice examples, not the live case's answers. **Got it. Let's play!** or **Skip guide** starts the pending real round; the walkthrough never auto-starts it, spends the game clock, saves a score, or activates the microphone.

Use **Pause demo**, **Replay**, numbered steps, or **Next step** to control the guide. **How to play** opens it again between rounds without resetting the game or result. During a live round that button is disabled so an open guide cannot cost the visitor time. Closing the guide or pressing Escape cancels the pending start; navigating away discards it.

Guide completion is in memory only, scoped to the current player and each of the four games. **Next player**, clearing player scores, or reloading resets it; different cases of the same game do not repeat it. A preview before check-in does not skip the next player's introduction. With reduced-motion enabled, the guide uses manual still frames and no autoplay. All guide code and artwork are in the self-contained offline copy; no video or audio service is required.

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

The hosted **Leaderboard** defaults to **Shared board**, with a top-three podium and top-ten table for each game/case. It refreshes every ten seconds while the tab is visible, and **Refresh board** updates it immediately. Each server-issued player session can publish only its own nickname and best result. Conditional Table Storage writes prevent a slower concurrent submission from replacing a better score.

**This device** shows the latest 200 local attempts under `jtc-playground-results-v1`. Legacy scores are preserved and are **not uploaded automatically**. Local-only players, downloaded files, and HTTP development previews use local storage only. The hosted and downloaded copies have separate browser storage. Shared failures never silently masquerade as an empty successful board: status and retry controls remain visible, and the last confirmed board may be stale.

Uploads retry idempotently when connectivity returns or **Retry sync** is clicked. Keep the tab open while results are pending: player tokens and pending submissions are memory-only and are lost on reload/closure; local history remains. Tokens expire after 24 hours. Old local-only results cannot be attached to a different shared identity by replaying them.

Use nicknames, not personal details. Public nicknames and scores can be seen by anyone visiting the shared board. No email, webcam, audio, transcript, or browser analytics are sent to the scoreboard. Results are friendly, low-trust competition, **not tamper-proof prize verification**: the client game and answer keys are public. Azure monitoring and hosting providers may retain normal service/access logs.

**Clear this device's scores** clears local history and the current player, not the public shared board or already-submitted scores. Administrative shared-data removal requires Azure operator access; no public reset/delete control or admin key exists in the frontend. Public reads exclude scores older than seven days, but this is not physical deletion: the host must remove cloud records after the event, and remove the dedicated resource group when no longer needed to stop ongoing private-endpoint/monitoring/storage charges. Do not delete the resource group until the host explicitly approves it.

All people, tenants, documents, amounts and sensor readings in the games are fictional. Thresholds and impact lines are illustrative game rules, not operational or safety advice. The source presentation is not included in the repository or release.

## Checks

```sh
npm test
npm run build
npm run lint
npm run test:e2e
npm ci --prefix api
npm test --prefix api
npm run check:api
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

The Pages URL is resolved from GitHub's Pages API, not inferred from a local preview. The repository is public by the owner's explicit choice.

## Implementation

React, TypeScript, Vite development server, Parcel/HTML inlining, Lucide icons, and local QR generation. Light is the default even when the device uses dark appearance. The theme toggle and explicit `?scoutTheme=dark` override are retained. Browser routes use hashes to work under a Pages project path without rewrites.

Content lives in `src/data/`; scoring, detection, sharing, and prompt formatting are in `src/lib/`. A service worker caches only the self-contained entry point, not API responses or player tokens. Gameplay assets are inline; the hosted shared scoreboard fetches only the configured Azure API. Do not point the public build at a database or embed any database key.

### Azure backend

`api/` uses Azure Functions v4 on Node.js 24 and Azure Table Storage. Infrastructure in `infra/` derives from the official `Azure-Samples/functions-quickstart-javascript-azd` v1.0.0 template. The isolated `rg-jtc-scoreboard-sea` resource group is in Southeast Asia. Flex Consumption uses 512 MB instances, zero always-ready instances and a ten-instance maximum. A user-assigned managed identity has resource-scoped blob/table data roles; shared-key storage access is disabled.

The subscription's inherited MCAPS governance policy requires private storage. The approved deployment therefore uses a dedicated VNet, function integration, and blob/table private endpoints with private DNS. These have ongoing charges even when no one is playing. Do not remove the policy or enable storage keys to work around deployment errors.

Endpoints under the configured `site.config.json.apiUrl`:

- `GET /health`: process health.
- `POST /players`: explicit nickname check-in; returns a private, memory-only player token.
- `POST /scores`: authenticated, validated best-score submission; no client-supplied identity allowed.
- `GET /scores`: public top-ten results per case, with no private tokens.

The API is intended for a public, informal booth event, not authentication or prize adjudication. It validates game IDs, score ranges, timing bounds and nickname content; conditional writes handle concurrent/retried submissions. A soft per-instance throttle bounds request bursts, but is not a distributed anti-abuse service.

Functions platform CORS and the API's own allowlist must both include `https://sithukyaw007.github.io`. The Functions host intercepts preflight requests, so application-level CORS headers alone are not sufficient. Verify a real browser check-in and an OPTIONS preflight with `Access-Control-Request-Method: POST` before marking a deployment ready.

Provisioning uses the validated subscription-scope `infra/main.bicep` and `infra/main.parameters.json`. Application deployment packages only `api/` with production dependencies, then uploads it to the resolved Function App with Azure CLI. Record changes in `.azure/deployment-plan.md`; validate/what-if before deployment. `site.config.json.apiUrl` is public routing configuration, never a secret.
