# COYL Protocol — the Behavioral Interrupt Protocol (BIP)

> The missing context layer between AI systems and human behavioral reality.

## What this is

BIP defines three primitives that let any AI system — LLM, wearable,
health app, enterprise tool — read, trigger, and observe behavioral
interrupts in the three-second window before a person's autopilot
script runs.

It is the human-behavior equivalent of Anthropic's Model Context
Protocol (MCP). Where MCP connects LLMs to software systems, BIP
connects LLMs to the user's behavioral state.

## The three primitives

1. **Behavioral Context Object** — `GET /v1/context/{user_id}`. Returns
   the user's current archetype, danger-window state, excuse category,
   self-trust score, risk level. Read by any AI system that wants to
   respond contextually.
2. **Interrupt Trigger** — `POST /v1/interrupt`. Any signal source (a
   Watch, a calendar, a tab-switch event) can push a behavioral signal.
   The engine decides whether to fire, defer, or ignore.
3. **Outcome Webhook** — registered consumers receive
   `INTERRUPT_FIRED`, `INTERRUPT_RESOLVED`, `PATTERN_DRIFT_DETECTED`,
   `RECOVERY_INITIATED` events. The behavioral data loop closes.

## Read the spec

- [BIP-0.1.md](./BIP-0.1.md) — the formal v0.1 specification.

## License

Apache License, Version 2.0. Open-source on purpose. The fastest path
to universal adoption is to let anyone implement the protocol. COYL's
reference engine — COYL Cloud — competes on data and integration
quality, not on locking down the spec.

## Reference engine

COYL Cloud is the reference implementation. It is the engine other
implementations are conformance-tested against. Public preview opens
Q3 2026.

## Conformance suite

Open-source test suite at `github.com/coyl/bip-conformance` (planned).
An implementation may display the "BIP-Compatible" badge once it
passes.

## Contact

- Editor: Iman Schrock, COYL — iman@coyl.ai
- Protocol questions: protocol@coyl.ai
- Press: press@coyl.ai
