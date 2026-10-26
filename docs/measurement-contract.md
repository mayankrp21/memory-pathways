# Measurement contract

**Status:** project definition v2  
**Scope:** a hypothetical instrumented, ChatGPT-style conversational assistant. This is not a measurement of the ChatGPT product or real ChatGPT users.

## 1. Research objective

Describe how memory segment retrieval and use at pre-defined memory opportunities relate to response quality, explicit memory complaints, learning updates, and later user return. Make visible that already-engaged users may both encounter more retrieval and return without a memory effect.

### Primary question

Among users with an eligible opportunity, how does 7-day return differ between users with an observed retrieval and users without an observed retrieval, before and after standardizing across prior engagement and opportunity type?

This is an adjusted association in a synthetic dataset. It is not a causal estimate.

### Secondary questions

- Which memory segments are retrieved for which opportunities, and how often do multiple segments appear together?
- Are retrieved items relevant, current, and supplied to active response context?
- Are responses judged to use memory appropriately, and what explicit complaints do users signal?
- Do memory writes, corrections, and reusable routines persist to later relevant opportunities?
- How do 1-, 7-, and 28-day return rates vary by retrieval status and opportunity type?

## 2. Memory taxonomy

The project follows the distinctions in Cognitive Architectures for Language Agents (CoALA). The paper is a conceptual framework; the operational measures below are project definitions.

| Module | Project definition | Important distinction |
|---|---|---|
| Working memory | Active information available in the current decision cycle/response. | It is the destination for retrieved content, not another long-term store. We measure context inclusion and observable response use. |
| Episodic memory | Records or summaries of prior events, interactions, or experiences. | A past event may be retrieved to continue a conversation; that does not establish that the whole history was searched. |
| Semantic memory | Facts, preferences, goals, relationships, and other knowledge about the user or world. | Stable facts can still be wrong or stale; correction and freshness matter. |
| Procedural memory | Explicit reusable skills, rules, routines, or methods. | Count only observable stored procedures. Do not claim access to hidden model weights or internal agent code. |

A turn can retrieve multiple long-term segments, and each segment can return multiple retrieval-call/item events. Counts of segment exposure may therefore overlap and need not sum to 100%.

## 3. Eligibility and opportunity rules

**Unit:** one synthetic user, represented by their first eligible opportunity. This prevents users with many interactions from dominating the main retention comparison. Secondary repeated-turn analyses would need to account for multiple turns per user.

**Eligibility:** label an opportunity from the current user turn and pre-anchor context before examining retrieval, response quality, complaints, or future return. Each opportunity definition should be versioned.

The demo uses these illustrative rules:

| Opportunity | Example user moment | Candidate memory segments | Possible write/learning event |
|---|---|---|---|
| New person or entity | “I’m starting a new role. My manager is Priya.” | Episodic + semantic | Store the introduction and/or entity facts |
| Continuing a journey | “Can we continue the plan we made for my job search?” | Episodic + semantic | Store a new experience or progress event |
| Correction or update | “That’s outdated - I moved to Bengaluru.” | Semantic | Update the fact and preserve the correction |
| Recurring preference or goal | “Remember that I prefer vegetarian options.” | Semantic | Add or update a preference |
| Explicit prior-context reference | “What did I decide about the course last time?” | Episodic + semantic | Store the resulting new event if relevant |
| Reusable method or routine | “Use my review format: wins, blockers, next steps.” | Procedural + semantic | Store a reusable routine, if explicitly represented |

These are candidate rules for a clearly labeled synthetic demo. They do not assert that the ChatGPT product uses these internal segments.

## 4. Cognitive actions and observable measures

| CoALA term | Project interpretation | Observable measure / proxy | Boundary |
|---|---|---|---|
| Grounding | Interaction with the outside environment; in this project, primarily the user and assistant dialogue. | Current-request support, response grounding rubric, explicit user feedback/correction, task completion signal. | Do not equate any positive user signal with satisfaction or retention. |
| Retrieval | Read from episodic, semantic, or procedural memory into working memory. | Segment queried, result status, item count, relevance/freshness, latency, and exact turn linkage. | A pull is not proof of use or benefit. |
| Reasoning | Processing current and retrieved information in working memory. | Visible response consistency, relevance, correct handling of updated/conflicting facts, and appropriate-use labels. | Do not collect or score hidden chain-of-thought. Evaluate outputs and traces that are intended for measurement. |
| Learning | Write, update, or delete long-term memory. | Write/update/delete event, validation result, later correction persistence, and forget compliance. | A write is not proof that the memory is correct or will be retrieved later. |

The conceptual flow is: **user observation → opportunity label → retrieval from zero or more long-term segments → possible inclusion in working memory → response/grounding → user signal → optional learning write → later retrieval and return.**

## 5. Exposure states and segment measures

For each eligible opportunity and candidate segment, preserve:

- `retrieved_nonempty`: a retrieval event was logged and returned one or more items;
- `retrieved_empty`: a retrieval attempt was logged but returned no item;
- `not_observed`: telemetry was available and no retrieval event was logged for that segment/opportunity;
- `unknown`: telemetry was missing or incomplete.

Never convert `unknown` to no retrieval.

| Metric | Formula / denominator | Interpretation |
|---|---|---|
| Segment retrieval coverage | Eligible users for segment with a non-empty or empty retrieval from that segment ÷ eligible users for that segment with known telemetry. | How often the segment was accessed in contexts where it could plausibly help. |
| Multi-segment retrieval share | Eligible users with two or more observed segments ÷ eligible users with known telemetry. | How often the assistant combines memory types. Segment shares may overlap. |
| Session-frequency / return curve | For each 10-point band of the share of prior 28-day sessions with an activity, mature users returning within 7 or 30 days ÷ mature users in that band. | Describes how return varies with memory activity frequency. The plotted smooth line interpolates binned rates; it is not a causal dose-response estimate. |
| Relevance rate | Retrieved items reviewed as relevant ÷ non-empty retrieved items reviewed. | Whether retrieved material matched the current opportunity. Requires a review rubric. |
| Fresh-and-correct rate | Retrieved items reviewed as both current and correct ÷ relevant retrieved items reviewed. | Whether relevant memory was still accurate. |
| Working-context inclusion | Retrieved items traceably placed into active response context ÷ non-empty retrieved items. | Whether retrieval reached the active response workspace. |
| Appropriate response use | Reviewed responses that appropriately use an included memory item ÷ reviewed responses with a memory item included. | Whether the visible answer used memory well. Not a direct measurement of private reasoning. |
| Explicit complaint rate | Eligible anchor users with a labeled memory complaint ÷ eligible anchor users with known complaint observation. | Rate of observed complaints, not all dissatisfaction. |
| Learning update validation | Writes/updates/deletions validated under the synthetic rubric ÷ eligible write/update/delete events. | Whether the requested or inferred memory change was performed correctly. |
| Correction persistence | Later relevant opportunities where the corrected state is used correctly ÷ reviewed later opportunities where it applies. | Whether a correction appears to persist. Only later relevant cases belong in the denominator. |

For a real study, report reviewer counts, rubric, agreement, and what fraction of possible examples was reviewed. A missing label is not automatically a negative label.

## 6. Retention outcomes and cohort maturity

- **Anchor:** first eligible opportunity in the selected synthetic cohort period; retention time starts at the end of the anchor session.
- **Session boundary:** a new session starts after 30 minutes without user activity.
- **Return:** a new session starts within 1, 7, or 28 days after the anchor session ends.
- **Maturity:** a user enters a 1-, 7-, 28-, or 30-day window denominator only if the full window has elapsed in the observation period; otherwise show the outcome as pending.
- **Comparison:** compare observed retrieval against no retrieval among eligible users with known telemetry. Report telemetry-unknown separately.
- **Uncertainty:** show count, denominator, rate, and interval. Use Wilson intervals for crude proportions. The dashboard’s standardized interval is an approximate stratified binomial interval.

Return measures activity only. It does not establish satisfaction, memory quality, or that memory caused the user to return. The dashboard’s session-frequency curve uses the full synthetic cohort and groups users by the share of their sampled prior 28-day sessions with working-context use, long-term retrieval, or either. Working-context use is a proxy for short-term memory activity, not another long-term retrieval store. The dashboard offers 7- and 30-day outcomes; users without a complete selected follow-up window are excluded. The curve smooths binned synthetic rates for readability, so read the points and denominators as the underlying summaries.

## 7. Confounding and interpretation

The primary confounding mechanism is prior engagement: already-active users may have more eligible moments and more retrieval events, and may be more likely to return anyway. Opportunity type can also affect both retrieval probability and return probability.

The dashboard presents:

1. **Crude rates** by observed retrieval status.
2. **Prior-engagement strata** (low, medium, high prior sessions).
3. **Standardized rates** that align the cohort’s measured prior-engagement and opportunity-type mix across retrieval groups.
4. **Sensitivity scenarios** where the generator sets retrieval’s true effect on return to zero, small positive, or small negative.

Standardization only addresses the measured factors included in the displayed model. It does not eliminate unmeasured confounding, opportunity misclassification, telemetry error, or selection effects. Do not adjust for post-anchor variables that may be part of the pathway, such as response quality or complaints, when estimating the total association with return.

Interpretation patterns:

- A crude gap that narrows after standardization suggests measured cohort composition explains some of the raw difference.
- A positive standardized gap is still not causal evidence.
- Higher retrieval coverage with low relevance/freshness suggests retrieval quality needs work.
- Good retrieval quality with low context inclusion suggests an integration issue.
- Good context inclusion with poor response use suggests the answer may mishandle retrieved evidence.
- Improved quality with unchanged return can still be a product benefit; retention is not the only success measure.
- Complaints must be monitored as a guardrail, including stale, incorrect, irrelevant, missing, and unwanted recall.

## 8. Synthetic data contract

- Fixed seed: `20261026`.
- The browser generates 5,200 synthetic anchor users locally; no API, database, external package, external font, or network request is required.
- The default scenario sets the direct retrieval effect on return to zero while prior engagement and opportunity type affect both retrieval likelihood and return likelihood.
- Optional scenarios add a small log-odds effect for demonstration only.
- Latent segment events generate retrieval result, item quality, context inclusion, appropriate use, complaint, learning-write, and outcome states.
- The generator’s known ground truth must always be labeled as simulated; generated values are not product findings.

## 9. Next-stage research

A real observational study would require a system the researcher is authorized to instrument, with exact turn-to-retrieval links, segment identifiers, result status, context inclusion, memory writes, feedback, and session outcomes. Do not infer internal ChatGPT events from a conversation export.

A causal retention study would require a defensible experimental or quasi-experimental design. Any randomized retrieval policy must be safe, limited to eligible opportunities, assigned before retrieval, and monitored for accuracy, privacy, user control, and unwanted recall. The portfolio dashboard does not claim such an experiment was run.
