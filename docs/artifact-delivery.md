# Exact CI artifact delivery

UDS-007 implements the UI Design Sandbox pilot for Governance ADR-010. The
current slice builds, packages and uploads an immutable release candidate.
Production activation remains gated by INF-014 provisioning and integration.

CI checks out the exact PR head or push SHA, runs packaging tests and builds
once without deployment credentials. It packages dist as sandbox.tar.gz and
adds release.json with source_sha, workflow_run_id and workflow_run_attempt.
The artifact name also includes the run attempt, allowing reruns without
silently replacing an earlier artifact. Actions and transport dependencies
are pinned to reviewed commit identities.

The sidecar and package-result.json bind the compressed tar bytes. The Actions
artifact digest binds the outer download container; it is not the tar digest.
The deployment adapter must validate both the GitHub workflow/run identity and
the tar digest, then check release metadata against the independently selected
source SHA. Body-supplied metadata alone never proves build provenance.

The target helper stages under /var/www/ui-design-sandbox/releases/<sha>,
switches current with an expected-current guard, checks public HTTPS root,
/m/balance-vim-log-redesign and uncached release.json, and can roll back to the
previous release without rebuilding. Infrastructure owns installation and
Cloudflare/Nginx configuration.

The old automatic SSH rebuild job is removed by this proposal. Do not merge
this delivery cutover until the compatible helper, protected environment and
rollback declaration have been reviewed and provisioned. The legacy deploy.sh
is retained temporarily for the separately reviewed migration rollback; it is
not invoked by the proposed workflow. No deployment success is claimed by an
artifact upload or local packaging test.

Artifact retention is 30 days for download candidates. Host releases used as
current/previous must remain available for rollback independently of Actions
retention. The final Web-only pilot must demonstrate download, deployment,
failure recovery and a fresh-chat resume using authenticated result references.
