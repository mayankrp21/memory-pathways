# Memory Pathways

**Memory use, experience, and return in conversational AI**

A visual, self-contained portfolio demo exploring how episodic, semantic, and procedural memory retrieval may connect to response quality, explicit user complaints, learning updates, and subsequent return. Working memory is represented as the active response context into which long-term memories may be retrieved.

This is a **study of a ChatGPT-style assistant**. 

## Open the demo

Open `index.html` in a browser. All styles, charts, and data generation are local. The demo uses no live services, APIs, databases, external JavaScript packages, or external fonts. It can be hosted as a static site, including GitHub Pages.

## Research question

Among users who reach a pre-defined memory-relevant moment, how do observed memory segments and their use relate to (1) explicit memory-related complaints and response quality, and (2) return within 1, 7, and 28 days? How much of a crude return difference remains after standardizing for pre-anchor engagement and opportunity type?

The dashboard reports associations. It does not claim that memory causes user retention.

## What the demo shows

- A plain-language pathway from opportunity to retrieval, working context, answer, feedback/learning, and later return.
- Four memory modules: working, episodic, semantic, and procedural.
- Concrete synthetic opportunities such as a new person introduction, a continuing personal journey, a correction, a recurring preference, a prior-context reference, or a reusable method.
- Segment-level coverage, relevance, freshness, response-context inclusion, and appropriate-use measures.
- Explicit memory complaint and learning-update summaries.
- Crude and engagement/opportunity-standardized return comparisons with maturity counts and uncertainty intervals.
- A smooth three-series curve showing 7- or 30-day return by the share of observed sessions with short-term/working-context use, long-term retrieval, or either. The curve uses the full synthetic cohort and shows an association, not a causal effect.

## Synthetic data

The fixed-seed generator creates 5,200 synthetic users in the browser. The default scenario sets retrieval’s direct effect on return to zero while prior engagement and opportunity type raise both retrieval and return likelihood. The demo therefore illustrates why a raw return gap can be misleading. Scenario controls alter the assumed effect for teaching purposes; none of the values are empirical findings.

## Limitations and next step

Synthetic data can illustrate measurement and bias; it is based on the trends observed on actual dataset.


