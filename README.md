# Bimora

An insurance agent concept for Ditto. **Understand first. Recommend second.**

Bimora starts with the person, not the policy. It learns the household, existing cover and what a hospital bill would cost the family, finds the gaps that actually matter, and recommends a small number of options with the trade-offs written down. Payment needs explicit approval, and policy issuance is verified separately from payment.

> This is a product concept. Plans, prices, policy analysis, payments and issuance are simulated and clearly labelled. It is not a live Ditto product.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to ./out
```

Node 20+. The build copies the self-hosted fonts from `node_modules` into `public/fonts` (see `scripts/copy-fonts.mjs`).

## Environment variables

See `.env.example`.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BASE_PATH` | Sub-path when hosted under one (GitHub Pages uses `/bimora`). Empty for root hosting. |
| `NEXT_PUBLIC_SERVICE_MODE` | `mock` (default). Only mock providers exist today. |
| `GNANI_API_KEY`, `PINE_LABS_*`, `DELHIVERY_API_KEY`, `WHATSAPP_BSP_API_KEY`, `SMS_PROVIDER_API_KEY`, `LLM_API_KEY`, `DOCUMENT_AI_API_KEY` | Reserved for real integrations. Keep them server-side; never put secrets in `NEXT_PUBLIC_*`. |

## Routes

| Route | What it is |
|---|---|
| `/` | Public landing page (no login) with a live demo conversation, policy upload, coverage gaps, recommendation, voice, follow-up, advisor escalation, guardrails and FAQ |
| `/start` | Onboarding. Adaptive questions, one per screen. `?intent=cover\|policy` |
| `/bimora` | The product: chat agent, My coverage, My policies, Recommendations, Tasks, Renewals, plus "Your insurance picture". `?talk=1` opens voice |
| `/privacy`, `/terms` | Placeholders, clearly marked for legal and compliance to replace |

## Architecture

```
src/
  config/bimora-agent.ts   System prompt, agent loop and guardrails (separate from UI)
  lib/types.ts             Domain model: User, Household, Policy, CoverageGap, Recommendation,
                           Quote, Action, Reminder, Document, AdvisorEscalation, Payment,
                           PolicyIssuance, Conversation, Message. PaymentStatus and
                           IssuanceStatus are separate types and never collapsed.
  lib/agent/               Deterministic agent: question bank (asks only decision-relevant
                           questions, one at a time), gap analysis, recommendation builder,
                           intent routing. Facts, assumptions and unknowns are kept apart.
  lib/mock/data.ts         Demo dataset, every record flagged isMock
  services/contracts.ts    Interfaces: VoiceService, LocationService, PaymentService,
                           WhatsAppService, SMSService, CallService, QuoteService,
                           UnderwritingService, PolicyIssuanceService,
                           DocumentAnalysisService, AdvisorEscalationService
  services/mock.ts         Mock providers with realistic latency
  services/index.ts        Registry: swap a mock for a real client here
  services/scenarios.ts    Demo switches to trigger failure states
  services/errors.ts       Human copy for every failure; no technical errors reach users
  lib/analytics.ts         Event hooks with a key whitelist; no PII or health data
  components/landing       Landing page sections
  components/shared        Policy upload, recommendation set, approval flow, voice, advisor
  components/app           App shell, chat, views, client store
```

The agent engine is rule-based so the demo is deterministic. When an LLM is connected, keep the planner as the source of truth for *what* to ask next and use the model for phrasing and open questions, with `BIMORA_SYSTEM_PROMPT` as the system message. Enforce guardrails in code (approval before payment and separate issuance checks already are).

## Mocked integrations

| Area | Interface | Planned provider | Today |
|---|---|---|---|
| Voice (ASR/TTS) | `VoiceService` | Gnani | Simulated turn with scripted sample questions |
| Location | `LocationService` | Delhivery | Static city list |
| Payments | `PaymentService` | Pine Labs | Simulated; refuses to run without an approval timestamp |
| WhatsApp / SMS / Calls | `WhatsAppService`, `SMSService`, `CallService` | TBD | No-op mocks |
| Quotes | `QuoteService` | Insurer APIs | Returns the illustrative premium, flagged |
| Underwriting | `UnderwritingService` | Insurer APIs | Simple age/condition rule |
| Issuance | `PolicyIssuanceService` | Insurer APIs | Simulated, independent of payment |
| Document analysis | `DocumentAnalysisService` | TBD | Returns a labelled sample; the file is never read |
| Advisor escalation | `AdvisorEscalationService` | Ditto CRM | Returns a demo reference |

## Still needed for production

1. Backend: auth, persistence for households, conversations, policies and actions, consent records and audit logs.
2. LLM integration behind a server route, with the system prompt and guardrails above.
3. Document AI for real policy parsing, with citations back to the policy wording.
4. Insurer integrations for quotes, underwriting, issuance and renewal status.
5. Gnani streaming voice, Pine Labs payments with webhooks, Delhivery location, WhatsApp BSP and SMS.
6. Advisor escalation into Ditto's CRM with full conversation context.
7. Legal and compliance copy: privacy policy, terms, intermediary disclosures, grievance contacts.
8. Analytics destination wired to the existing `track()` hook.

## Demo controls

In the app, open **Demo controls** to make the upload fail, Bimora go silent, the quote or insurer be unavailable, the payment fail, or issuance stay pending. Use **Reset demo** to start over.
