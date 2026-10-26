# Synthetic data dictionary

All fields are generated locally by `data/simulate.js` with a fixed seed. Each row represents one synthetic user’s first eligible anchor opportunity. Segment events are nested on that row. A segment can have multiple retrieval-call/item events at one anchor; a retrieval may also return an empty result.

| Field | Meaning |
|---|---|
| `id` | Synthetic user/anchor identifier; no real identity. |
| `engagement` | Prior activity band (`Low`, `Medium`, `High`). |
| `priorSessions` | Number of synthetic sessions in the seven days before the anchor. |
| `historySessionCount` | Number of synthetic sessions sampled for memory-frequency measures in the 28-day pre-anchor window. |
| `shortTermSessionShare` | Share of sampled sessions with short-term/working-context use. This is a context-use proxy, not a separate retrieval store. |
| `longTermSessionShare` | Share of sampled sessions with an observed long-term retrieval. |
| `combinedSessionShare` | Share of sampled sessions with either working-context use or long-term retrieval. |
| `tenureDays` | Synthetic account age at the anchor. |
| `opportunity` | One pre-defined opportunity class. |
| `complexity` | Synthetic task/context complexity band. |
| `memoryEnabled` | Whether memory is available in the hypothetical system before the anchor. |
| `telemetryKnown` | Whether retrieval telemetry is available for this anchor. False maps to unknown exposure, not no retrieval. |
| `latentEvents` | Synthetic true retrieval events used by the simulator. Not an observable field for a real study. |
| `observedEvents` | Retrieval events available to dashboard metrics when telemetry is known. The dashboard counts events/calls, not only users with any retrieval. |
| `latentEvents[].segment` | `episodic`, `semantic`, or `procedural`. Working memory is modeled as the destination/context, not a long-term retrieval source. |
| `latentEvents[].result` | `empty` or `nonempty`. |
| `latentEvents[].quality` | `relevant_correct`, `relevant_stale`, `irrelevant`, `incorrect`, or `empty`. |
| `latentEvents[].contextIncluded` | Whether a non-empty retrieved item enters the active response context. |
| `latentEvents[].appropriatelyUsed` | Whether the item is included and used appropriately under the synthetic rubric. |
| `latentEvents[].rank` | Synthetic retrieval rank for demonstration only. |
| `latentEvents[].latencyMs` | Synthetic retrieval latency. |
| `responseGrounding` | Synthetic output-level label (`supported` or `unsupported`); not a chain-of-thought label. |
| `complaint` | Whether an explicit synthetic memory complaint is labeled in the anchor session. |
| `complaintType` | `incorrect memory`, `irrelevant memory`, `stale memory`, `missing memory`, or `unwanted recall`. |
| `writeEvents` | Synthetic long-term write/update events for eligible opportunities. |
| `writeEvents[].segment` | Long-term segment that receives the synthetic write. |
| `writeEvents[].status` | Whether the write validated under the generator rubric. |
| `writeEvents[].laterRelevant` | Whether a later synthetic opportunity arises to check persistence. |
| `writeEvents[].persisted` | Whether the validated update is used correctly later. |
| `base7`, `u1`, `u7`, `u28`, `u30` | Synthetic outcome-generation values. Scenario controls change assumed retrieval effect while preserving the cohort. |
| `followupDays` | How long follow-up is observable; determines if 1/7/28/30-day outcomes are mature. |

## Interpretation rules

- `observedEvents` is the measurement source for dashboard exposure metrics. `latentEvents` exists only so the simulator can apply a known hypothetical treatment effect; it is not a real-world telemetry source.
- A memory item event is not the same as a user-level exposure. Segment event counts may exceed user counts when a segment returns multiple items or multiple segments are retrieved.
- The return curve groups users by each memory activity’s percentage of sessions in the prior 28 days, then plots the mature 7- or 30-day return rate. Each plotted point is a 10-percentage-point band; the smooth curve is a visual interpolation. Working-context use, long-term retrieval, and their union form the three series.
- Segment cards and the retention curve use the full synthetic cohort. The opportunity selector filters the KPI snapshot, example, quality, and return-comparison views.
- Unknown telemetry is displayed separately.
- Pending return windows do not enter that window’s rate denominator.
- Complaint labels are explicit synthetic events; unlabeled users are not guaranteed to be satisfied.
