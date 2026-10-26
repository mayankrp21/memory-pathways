# Conceptual framework: CoALA and Memory Pathways

This project uses ideas from Sumers, Yao, Narasimhan, and Griffiths, “Cognitive Architectures for Language Agents” (CoALA, 2023; [arXiv:2309.02427](https://arxiv.org/abs/2309.02427)). CoALA is a conceptual framework for organizing language-agent memory and actions. It is not a validated product analytics standard, and this project does not claim to measure ChatGPT internals.

## Map from the paper to this project

| CoALA concept | How the project uses it |
|---|---|
| Working memory | Active workspace for the current response. Track whether retrieved information is supplied to this context. |
| Episodic memory | Earlier experiences or conversation events that may support continuity. |
| Semantic memory | Facts and knowledge about the user or world, including preferences and corrections. |
| Procedural memory | Explicit reusable skills, routines, or methods. The project does not infer hidden model weights or private system code. |
| Retrieval | Read from a long-term segment into working memory. Record each segment and result separately. |
| Reasoning | Process current and retrieved information in working memory. Measure visible response outcomes, not hidden chain-of-thought. |
| Learning | Write, update, or delete long-term memory. Check whether corrections and preferences persist at later relevant opportunities. |
| Grounding | Interact with the external environment. Here, the user dialogue is the primary environment; optional tools could be added as a later extension. |

## Project loop

**Observation → opportunity → retrieval → working context → reasoning/output → user feedback → learning write → future retrieval.**

The loop helps explain why “memory pull” is only one intermediate event. The user outcome depends on what was retrieved, whether it was current and relevant, whether it reached the response, how the answer handled it, and what the user experienced. Retention is a later behavior and may be affected by many other things.

## Design implication

The dashboard should use CoALA as the navigation and explanation structure, while keeping three evidence layers distinct:

1. **System events:** queries, returned items, context inclusion, memory writes.
2. **Reviewed outcomes:** relevance, correctness, response use, user feedback.
3. **User behavior:** later return, measured with a complete follow-up window.

No layer automatically proves the next one.
