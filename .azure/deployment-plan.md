# Shared JTC scoreboard deployment

Status: Deployed

## Approved scope

Keep the GitHub Pages URL and all four games. Add an isolated Azure backend in
Southeast Asia on subscription `e5b30712-e866-49c1-8ebe-95f569524df0`
(`ME-MngEnvMCAP637399-sithukyaw-1`), directory
`19ffb373-4547-4ebd-b7a8-2b4c6da14132`.

The user approved a dedicated backend, deployment files, possible hosting/storage
charges, and public shared nicknames/scores. Existing unrelated apps must not change.
Each device checks in independently; identity transfer between devices is out of scope.

## Architecture

Azure Functions Flex Consumption (Node.js 24, 512 MB, no always-ready instances,
maximum 10 instances), private Azure Table Storage using a user-assigned managed
identity, and template-provided Application Insights/Log Analytics.
The existing GitHub Pages frontend remains unchanged in hosting.
No database keys or administrative tokens go in the public frontend.

Recipe: direct Bicep provisioning and Azure CLI zip deployment, preserving the
official `Azure-Samples/functions-quickstart-javascript-azd` v1.0.0 infrastructure
and managed identity patterns. The MCP template fetch returned a redirect error;
the official Functions manifest resolved this exact public template.
The user additionally approved a dedicated VNet and two private endpoints after
the inherited MCAPS governance policy forced storage publicNetworkAccess to Disabled.
Use the official template's VNet integration and blob/table private DNS/endpoints;
do not bypass or exempt the policy. Storage remains protected by RBAC, TLS,
disabled shared keys and no anonymous blob access.
No legacy local scores will be uploaded. Public results are informal, not
tamper-proof competition entries. Check-in tokens are short-lived and only in
device memory; shared writes cannot choose another player's ID or nickname.

## Context and capacity

SEA Flex Consumption and Node 24 were confirmed via Azure CLI runtime discovery.
Storage quota is 250 accounts; the subscription inventory has only three storage
accounts. Provision one account and one dedicated Flex plan in the new resource
group, plus one user identity and monitoring resources. ARM validation will check
the final regional configuration before creation. Do not silently switch region.

## Sharing and offline behavior

Share only current-event nicknames and each player's best result per game/case.
Refresh visible boards automatically; keep each device's current player and guide
state independent. Display failed/pending submissions, with Retry while the
short-lived player session remains open. Offline/local-only check-ins and legacy
results are never uploaded automatically. Clearing local history does not delete
the shared board. Administrative cleanup uses the authenticated Azure account.
Sessions expire after 24 hours; public reads exclude scores older than seven days.
Table records remain until the host performs documented authenticated cleanup.

## Functional verification

The API's Node tests passed for independent player tokens, simultaneous updates,
retry idempotency, invalid scores and expired/forged sessions. The UI type-checks
and bundles. Browser tests with two isolated contexts and the actual service
logic passed shared rankings, independent active users, failed-upload retry,
explicit local-only check-in and light default on a dark device.
The Bicep template compiles using the official template modules. Only inherited
conditional-module nullability warnings remain; VNet/private-endpoint access
is guarded by the matching conditions and Application Insights is supplied.

## Deployment

Use subscription-scope Bicep with `environmentName=jtc-scoreboard`,
`location=southeastasia`, and `resourceGroupName=rg-jtc-scoreboard-sea`.
Zip only `api/` with installed production dependencies. Run ARM validation and
what-if before resource creation. Derive the Function hostname from the created
resource, and set `site.config.json.apiUrl` only after a successful health and
two-player score test. Do not publish a guessed endpoint.
Set `vnetEnabled=true` to comply with inherited storage-network policy.

## All validation checks pass

- Core validation: Azure CLI installed/authenticated; Bicep compilation; ARM
  subscription-scope validation; what-if preview.
- Policy validation: inspect subscription policy assignments and ensure no
  deny conflicts; ARM validation must pass.
- Role verification: inspect managed-identity Blob Data Owner (runtime/deployment),
  Table Data Contributor (scoreboard operations), and Monitoring Metrics Publisher
  assignments scoped to the new storage/monitoring resources.
- Functional validation: API unit tests, client build/lint, and browser suites.

## Section 7: Validation Proof

The official `validate-deployment.sh` completed with OVERALL: PASS:
CLI/auth/build/ARM validation/what-if all passed. What-if reported 14 Create,
0 Modify, 0 Delete. Current assignments cover Defender provisioning for unrelated
services, not a blocking policy for these resources. API tests: 3 passed.
UI tests: 18 unit and 29 browser tests passed. Managed identity data-plane roles
match Table CRUD, Functions blob deployment/runtime, and monitoring publishing;
no shared keys, connection strings or broad subscription-role grants are used.

Commands: `validate-deployment.sh --scope sub --location southeastasia
--subscription e5b30712-e866-49c1-8ebe-95f569524df0`, `npm test --prefix api`,
`npm test`, `npm run build`, `npm run lint`, and `npm run test:e2e`.
Every command completed successfully.

The initial resources provisioned successfully. ZIP upload was blocked because an
inherited management-group modify policy disabled storage public networking.
Live activity logs confirmed `StorageAccount_PublicNetwork_Modify`; all managed
identity roles were already present. Do not disable the policy or enable keys.
The revised network template requires repeat ARM validation/what-if before deployment.
The repeat validation completed with OVERALL: PASS. The helper's textual change
counter reported six "Delete" field deltas, so a separate structured what-if
query inspected actual `changeType == Delete` resources and returned an empty
array: no resource deletions. The existing managed identity roles remain unchanged.
The client build also passed again after enabling the network template.

## Live Azure verification

The private-network revision provisioned successfully. Both private endpoints
are Approved/Succeeded, and the Function App's ARM virtualNetworkSubnetId resolves
to the dedicated app subnet. ZIP deployment then succeeded without changing
storage policy, authentication or shared-key settings.

Verified hostname: `func-api-j46cwvlkqvemm.azurewebsites.net`.
Health and storage-backed score reads return HTTP 200. Two independently issued
setup sessions submitted simultaneous zero-point noisy-lift practice results;
both are visible across API clients. These rows are clearly named `Setup check A`
and `Setup check B`, not actual visitor results. CORS rejects an unrelated origin,
unauthenticated writes return 401, and public output contains no player tokens.

The final backend code ZIP was deployed successfully over the compliant private
storage connection. The public site's API configuration now uses the verified
hostname. Final checks passed: 3 backend tests, 18 client unit tests, 30 browser
tests, TypeScript build and lint. The GitHub Pages frontend remains the same URL.

## Final browser verification

The deployed Functions host required its own CORS allowlist in addition to the
handler's CORS headers: its initial preflight interception omitted the origin.
Configured the approved GitHub origin at the platform and persisted the setting
in the Bicep siteConfig. Actual OPTIONS now returns the expected origin, POST
method and content-type/authorization headers.

After propagation, two real, independent Chromium laptop/phone contexts used the
public Pages URL, checked in concurrently, submitted zero-point labelled setup
scores and each read both names from Azure. Their active player names stayed
independent. Both began in light mode despite dark operating-system appearance.
The downloaded HTML and hosted HTML match the verified build byte-for-byte.
The zero-point `Setup laptop` and `Setup phone` checks are confined to the noisy-lift
practice case alongside the earlier setup records.

## Code-only update: untimed Beat the Agent

The user requested removing Beat the Agent's 60-second countdown and automatic
timeout. Replace it with a forward elapsed counter; complete-answer status and
score depend on answer accuracy and evidence only. Keep elapsed time as the
existing leaderboard tie-breaker, and leave all other games unchanged.

This update changes only frontend code and the deployed Function's score
validation. Remove the Beat-specific 60-second completeness gate and generic
24-hour result-duration cutoff for Beat while retaining finite nonnegative
time validation and normal session authentication. Do not change any Azure
resources, policy, identity, network, region, endpoint, or shared records.
Deploy the existing Function App code package before publishing the new frontend.
Verify the existing resource/app/CORS settings read-only; no provisioning needed.

### Code-only validation steps

- Read existing Function runtime/host configuration and the verified deployment target.
- Run backend score/session tests and frontend unit/build/lint checks.
- Verify count-up beyond 60 seconds, manual submission, reset/navigation cleanup,
  unchanged game scoring, responsive layouts and shared long-score publication.
- Confirm resource-scoped managed identity, private networking and CORS have no code
  or infrastructure changes in this update.
- Package and deploy only existing `api/` application code, then run API/preflight
  checks and publish the matching frontend. No ARM provisioning is required.

### Code-only validation proof

Client tests: 19 passed. Backend tests: 4 passed, including finite valid Beat
durations of 60 seconds, 125 seconds and 48 hours, while rejecting invalid scores
and times. TypeScript build and lint passed. Targeted browser checks passed for
complete cited submissions after 125 seconds, no auto-timeout, timer stopping
only on submission, reset and navigation cancellation, plus guide/layout checks.
The shared-client browser test also submitted a fully correct 125-second attempt
through the actual service validation and displayed it on the shared board.
Existing health/storage/preflight checks passed. This is a code-only ZIP update;
the resource target and data-plane roles remain unchanged.

The code-only ZIP deployment completed successfully. Live health/storage/CORS
checks passed. Complete Beat payloads with 125-second and 48-hour durations now
pass score validation and reach the normal 401 authentication check when sent
without a token (rather than the old 400 duration rejection). No shared test
records, cloud resources, role assignments or settings were changed.

## Delivery

1. Select the consumption hosting recipe and verify regional availability.
2. Implement isolated API, validation, concurrency-safe best-score updates and tests.
3. Add shared check-in, refreshed rankings, explicit synchronization/offline states,
   updated consent, and light-by-default presentation.
4. Validate infrastructure and app; deploy the backend and verify independent clients.
5. Update GitHub Pages and the standalone build; document privacy and cleanup.

## Constraints

Do not upload legacy local results automatically. Do not share the selected player
or gameplay state between devices. No public shared-board delete button, embedded
admin key, database credentials, webcam, audio collection, or paid-service upgrades.
Report synchronization errors explicitly; offline play remains available and labelled.
