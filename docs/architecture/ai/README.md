# AI architecture proposal

**Status** Proposed for discussion on `feature/ai`. The current display pipeline and AI runtime remain in use. This document describes a possible migration.

## What changes

Today a display insight is generated from one playback record. The API handles both the Admin request and the automatic queue path, builds a text prompt, calls a model, and saves the resulting Markdown, model, and timestamp. The same display workflow already separates private image storage from Vision processing. [Current display steps](../steps/README.md)

The proposal adds a NestJS module at `backend/api/src/modules/ai`. Other modules request a named workflow and pass its scope. The AI module builds its evidence, chooses the workflow, runs the required steps, validates the result, and records what happened. A display insight remains an option. Longer-term options include campaign summaries, measurement triage, and experiment proposals.

| Module area | Responsibility |
| --- | --- |
| `contracts/` | Versioned workflow inputs, evidence records, artifact schemas, run states, and provider result contracts. |
| `orchestrator/` | Authorize the workflow, apply evidence gates, choose the next allowed step, enforce budgets, and handle cancellation and retries. |
| `context/` | Read scoped domain data and calculate aggregates. Produce a versioned evidence snapshot with a cutoff time, metric definitions, coverage, and internal source references. |
| `agents/` | Own a specific decision or artifact, including the prompt, response schema, and allowed evidence. Start with an insight writer. Establish a measured need before introducing a second model call. |
| `providers/` | Configure capabilities and approved model routes. Normalize structured results, usage, latency, and errors across SDKs. |
| `runs/` and `workers/` | Persist run state and artifacts in MongoDB. Use Redis-backed workers for asynchronous execution, including progress events and job recovery. |
| `evaluation/` | Keep representative synthetic or redacted cases, baseline results, and criteria for route or prompt changes. |

## Orchestration and agent responsibilities

Use explicit workflows in NestJS. The orchestrator chooses from a fixed list using task, scope, evidence quality, and policy. For example, a single-display workflow can check the evidence, dispatch one writer, and validate the result. A campaign workflow can compute time-window comparisons first and ask a campaign analyst to describe relevant differences. Agents return typed artifacts to the orchestrator. Cross-workflow delegation, model-selected jobs, and write-capable tools can wait until there is a demonstrated use case and an approval model.

| Workflow | Deterministic steps | Model responsibility and release |
| --- | --- | --- |
| Display insight | Check capture and analysis status. Build a playback summary with the available metrics. | Write a brief PT-BR insight from that evidence. Return an insufficient-evidence result when applicable. |
| Daily or weekly campaign digest | Aggregate coverage, audience, and comparisons over comparable units and time windows. | Explain the changes and identify opportunities. Save a draft with references to the supporting aggregates. |
| Measurement triage | Detect missing frames, devices with stale data, queue failures, and changes in coverage using rules. | Optionally group incidents and draft a troubleshooting summary. Operational alerts derive from the rules. |
| Experiment proposal | Check data coverage, comparable periods, candidate units, and baseline metrics. | Draft a hypothesis, success metric, and test design for a human to approve. Campaign and device changes stay in existing product workflows. |
| Campaign Q&A | Authorize a small set of read-only aggregate queries scoped to the account. | Later, answer using those results and cite the periods and aggregates. Test the need for multi-step retrieval before adding it. |

Example output sections include findings with evidence references, limitations, and recommendations with an owner or next action where supplied. The API checks the schema, evidence references, scope, and whether claims are consistent with metric values before storing an artifact. Treat news and creative copy as untrusted text. Tool inputs, workflow routing, and approvals are controlled by the application.

## Data and memory

- Vision still owns raw image analysis. The AI module receives derived metrics and contextual text. Its provider payload excludes images, signed URLs, identifiers for individuals, and precise addresses. Start with aggregate audience counts and coverage. Evaluate demographic breakdowns separately and apply minimum cohort sizes if approved.
- Distinguish camera unavailable, analysis pending or failed, analyzed with zero detections, and analyzed with detections. A single frame supports a count at capture time. Playback duration alone cannot establish retention or attention. Label estimates and compare like periods using explicit denominators.
- Keep historical memory as scoped, versioned metric snapshots and approved artifacts. Store the observation window, source references, coverage, and model and prompt versions. Start with MongoDB queries over derived aggregates. Add retrieval or embeddings only if evaluation shows that they improve a specific workflow.
- Keep human feedback and experiment outcomes separate from generated claims. New runs can retrieve approved findings and measured outcomes for the same scope.

For a campaign digest, suppose one display has analyzed frames with zero detections and another has no camera frames. The context builder includes the first in measured coverage and flags the second as missing evidence. The agent can summarize the measured result and suggest checking the second display. It cannot conclude that both displays had zero audience. The Admin shows coverage next to the result so the operator can review it.

## SDK, provider, and runtime options

| Option | Assessment for AdaptaMídia |
| --- | --- |
| Direct Google SDK | Keep it as the migration baseline. It already supplies model and usage metadata. Verify equivalent structured output, cancellation, and token reporting in any replacement before switching traffic. |
| Vercel AI SDK | Recommended first evaluation for a provider-agnostic TypeScript adapter inside NestJS. Its registry and structured output APIs fit this boundary. Keep its types inside the adapter and configure direct Google initially. Provider capabilities and usage detail still vary. [Provider registry](https://ai-sdk.dev/docs/ai-sdk-core/provider-management) · [Structured outputs](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) |
| OpenRouter | Candidate for synthetic or approved aggregate experiments across providers. Evaluate regional requirements, downstream provider eligibility, retention, observability, and reproducible routing. If enabled, require an explicit provider allowlist and approved retention policy, and test schema support for each route. [Provider routing](https://openrouter.ai/docs/guides/routing/provider-selection) · [Data processing terms](https://openrouter.ai/assets/data-processing-agreement.pdf) |
| Vercel AI Gateway | A separate hosted routing option to compare if managed routing is useful. Evaluate per-provider controls, retention, billing visibility, and the extra dependency before adopting it. The AI SDK proposal can use direct providers. [AI Gateway](https://vercel.com/docs/ai-gateway) |
| LangChain and LangGraph | Revisit when graph checkpoints, branching workflows, or pause-and-resume approvals become hard to maintain in NestJS. Start with explicit orchestration so the team can measure the need and assign ownership for durable state. [LangChain overview](https://docs.langchain.com/oss/javascript/langchain/overview) · [LangGraph persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence) |

Model routes should be assigned per workflow rather than exposed as an unrestricted catalog. Start with a fast, approved default and an evaluated fallback within the same data policy. Let authorized operators override the route for comparisons. Use one owner for retries and fallback so application, gateway, and worker attempts cannot multiply each other. A refusal or invalid evidence must surface as a status the operator can understand.

## Workers and failure recovery

The first worker runs the AI workflow as one job and can live in the existing API process during local development. Keep detection and AI on separate queues. A separate worker process becomes useful when campaign batches need independent concurrency, cost control, or deployments. The existing queue module uses `@nestjs/bull`. Reuse its operational pattern for the pilot and evaluate BullMQ as a separate migration. [Current queue module](../../../backend/api/src/modules/queue/queue.module.ts) · [Idempotent jobs](https://docs.bullmq.io/patterns/idempotent-jobs)

1. Persist an authorized run and enqueue intent together using the same MongoDB record. A dispatcher can reconcile unpublished intents. Pass only a run ID in the queue payload.
2. Deduplicate using a scoped key over workflow, target, evidence revision, and workflow version. Return an existing run for duplicate submissions. Explicit regeneration creates a distinct revision. A queue job ID is a secondary guard.
3. A worker claims the run with a lease and publishes progress. Use compare-and-set transitions and idempotent artifact writes so a stalled worker cannot overwrite a newer result. Provider calls may still repeat after an ambiguous timeout, so record each attempt and bound retries, tokens, and concurrency.
4. Retry transient transport errors with backoff. Surface evidence and policy failures, quota exhaustion, and exhausted retries. Cancellation is cooperative. An accepted provider call can still incur usage.
5. MongoDB owns the run state. The Admin gets status via SSE or polling and can reopen a run after a disconnect. A failed regeneration leaves the previous validated result available.

## Admin design system

Reuse the existing Admin layout and components. Introduce a shared **AI run status**, **evidence panel**, and **recommendation card** across Exibições and future campaign views. Separate observed metrics, generated interpretations, and approved actions in the interface.

| UI pattern | Information and behavior |
| --- | --- |
| Run status | Show queued, analyzing, completed, insufficient evidence, or failed. Display the last successful result during regeneration and explain failures in plain language. |
| Evidence panel | Show metric values, date range, units, coverage, and links to authorized aggregate records. Allow the operator to see the basis for each claim. |
| Recommendation card | Show the proposal, rationale, evidence, and review state. Use explicit confirm or reject actions for experiments and any later operational change. |
| Run details | Show model, timestamp, and a run ID for support. Make provider usage and budgets available in an operator view. Reuse existing typography, focus styles, and semantic status colors. |

## Delivery and validation gates

| Stage | Scope | Evidence needed before advancing |
| --- | --- | --- |
| 1. Baseline and boundary | Document the existing insight flow and draft contracts. Measure the direct Google baseline against synthetic examples, including missing frames and zero detections. | Agreed metric definitions, source references, no image data in provider requests, and reproducible token counts. |
| 2. Pilot | Move the display insight behind the AI module and shadow-test the AI SDK adapter. Keep a rollback route and preserve existing Markdown insights. | Comparable factual accuracy and PT-BR quality, bounded tokens and latency, visible errors, and no duplicate artifacts under retries. |
| 3. Durable workflow | Add run tracking and a dedicated queue. Start with one deployable worker role and one daily campaign digest for a small pilot scope. | Restart recovery, stable deduplication, scoped reads, and an operator-visible status after closing and reopening the Admin. |
| 4. Broader capabilities | Measure triage and experiment drafts. Revisit gateways or graph orchestration only when a measured bottleneck justifies them. | Human review of recommendations, useful actions, and spend and quality within agreed limits. |

Evaluate numeric claims against fixtures, rejection of unsupported claims, scope isolation, resistance to instructions embedded in content, structured output validity, and Portuguese clarity. Track p95 queue wait and end-to-end latency, token usage by workflow and model, duplicate attempts, and operator acceptance. Set thresholds after recording the baseline. Log run and step IDs, model routes, latency, and usage with unknown counts marked as unknown. Keep raw prompts, captures, and credentials out of telemetry.

### Decisions for the PR

- Which workflow should follow the single-display pilot, campaign digest or measurement triage?
- What evidence coverage and minimum audience cohort should be required for summaries?
- Which provider and retention policies are acceptable for production traffic? How long should run metadata, aggregate snapshots, and approved artifacts be kept?
- When should a worker get its own deployment, and who owns retries, spending, and run review?

[See the proposed sequence steps](../steps/README.md#proposed-ai-workflow).
