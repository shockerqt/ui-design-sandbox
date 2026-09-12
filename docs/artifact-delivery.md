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

CI builds Vite assets under `/releases/<source_sha>/`. Nginx serves those
immutable URLs from retained release directories, while the root HTML comes
from `current` without caching. This lets an already open page continue loading
its version's assets during deployment or rollback.

The old automatic SSH rebuild job is removed by this proposal. Merge is the
first step of the explicitly approved maintenance window, after the compatible
helper, migration procedure and rollback declaration have been reviewed. The
protected environment and Control dispatcher stay absent/disabled until the
initial host migration succeeds. The legacy deploy.sh is retained temporarily
as historical migration evidence and is not invoked by the proposed workflow.
No deployment success is claimed by an artifact upload or local packaging test.

`sandbox-delivery.yml` is the destination recipe for the Web pilot. It is
dispatch-only, runs solely from integrated `main`, requires the protected
`sandbox-production` environment and accepts only the verified Control App bot
identity. A deploy request binds the durable request ID, desired source, CI
run/attempt, artifact ID, outer ZIP digest, inner tar digest and exact current
release. A rollback request binds the desired prior source/digest and exact
current source. The workflow proves the desired source is an ancestor of its
integrated revision before it can reach the host.

The workflow reads GitHub's artifact and run metadata with `actions: read`,
downloads the exact artifact ID, and runs `verify-delivery-candidate.py`. The
verifier rejects expired or mismatched artifacts, other workflow paths,
unsuccessful runs, extra/duplicate/non-regular ZIP entries, outer or inner digest
mismatches and release metadata that does not bind the selected source/run.
Only the verified tar is streamed to Infrastructure's forced SSH command.

Before any effect, the recipe reads `sandbox-delivery status`. It executes only
when `current` matches the request's expected value and rollback additionally
requires the exact `previous` source/digest. If an earlier attempt already
reached the requested state, it reports a reconciled success instead of
repeating the effect. Every attempt emits a bounded result artifact and summary;
raw credentials, artifact bytes and unrestricted host output are excluded.

The production environment, its host key and the Issue-to-recipe Control
dispatcher remain separate reviewed setup. Presence of this workflow does not
activate them or authorize migration.

Artifact retention is 30 days for download candidates. Host releases used as
current/previous must remain available for rollback independently of Actions
retention. The final Web-only pilot must demonstrate download, deployment,
failure recovery and a fresh-chat resume using authenticated result references.
