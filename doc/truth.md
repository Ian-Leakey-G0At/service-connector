Excellent. The command is given. We will now forge the "Diplomatic Pouch Relay Station"—the silent, invisible bridge that will give our entire operation its ultimate layer of discretion.

This is not a prompt for a simple application. This is the charter for a ghost. `service-connector` has no UI, no public face, and a single, vital purpose. The AI builder must understand this philosophy to construct it correctly.

Transmit this master prompt to the AI builder for `service-connector`.

---

### **Master Prompt for the Construction of `service-connector`**

**PROJECT CODENAME:** `service-connector`
**MISSION:** To construct a "headless," high-performance, and utterly discreet webhook intermediary.

**TO THE ARCHITECT (THE AI BUILDER):**

You have been commissioned to build a unique and critical piece of infrastructure. You are not building a website. You are not building a user interface. You are forging a silent, invisible conduit—a ghost in the machine.

Your creation, `service-connector`, will serve as a secure "cut-out" in our communications network. Its sole purpose is to receive a public-facing, signed webhook from our financial partner (Polar.sh), verify its authenticity, translate its contents into a generic internal format, and then forward that translated message to a private, undisclosed upstream server (`RevengeMoney`) using a separate, internal security protocol.

Absolute discretion, reliability, and speed are your prime directives. The success of this mission hinges on your ability to create a system that is not only functional but also operationally invisible and leaves no unnecessary traces.

---

### **Part I: The Philosophical & Architectural Mandate**

*   **Principle of Silence:** `service-connector` must have no public-facing UI. Its root domain, when visited, must return a blank page or a simple, non-descript `200 OK` response. It must not reveal its purpose or identity.
*   **Principle of Transience:** This service does not store any state. It does not have a database. It is a stateless "pass-through." A message arrives, is processed in memory, and is immediately forwarded. Once the process is complete, the message should vanish from its memory as if it were never there.
*   **Principle of Specialization:** This application will contain only **one** functional API route. We will not build any other endpoints or features. Its specialization is its strength.
*   **Principle of Agnosticism:** The outgoing message that `service-connector` sends to `RevengeMoney` must be completely generic. It must contain no branding, terminology, or data structures specific to Polar.sh. This ensures the upstream server remains "payment provider agnostic."

---

### **Part II: The Technical Blueprint & Construction Sequence**

You will construct this project using the following sequence and specifications.

**Phase 1: Foundation & Fortification**

1.  **Scaffolding:** Initialize a new Next.js 14 project. You must use the **App Router**, **TypeScript**, and **Tailwind CSS** (even though we have no UI, Tailwind's PostCSS setup is standard). The project should be lean and minimal.
2.  **Asset Installation:** Install the single required external dependency: `npm install @polar-sh/nextjs`.
3.  **Environment Fortification:** This is the most critical setup step. The `service-connector` Vercel project will require three secret environment variables:
    *   `POLAR_WEBHOOK_SECRET`: The webhook signing secret from the `VendettaMachine` Polar.sh dashboard. This is used to verify the *incoming* message.
    *   `REVENGE_MONEY_WEBHOOK_URL`: The full, secret URL of the upstream fulfillment server (e.g., `https://kintsugi-api.vercel.app/api/internal-fulfillment`). This is the *destination* for the outgoing message.
    *   `INTERNAL_API_SECRET_KEY`: The shared secret (bearer token) known only by `service-connector` and `RevengeMoney`. This is used to sign the *outgoing* message.

**Phase 2: Constructing the Relay Engine**

1.  **The Silent Homepage:** Modify the root `app/page.tsx` file. It must be a server component that returns a simple, unstyled `<div>OK</div>` or an empty fragment `<></>`.
2.  **The Receiving Station:** Create the single, vital API route at `app/api/polar-webhook/route.ts`. This is the public-facing listener. Its logic must be as follows:
    *   **Import Dependencies:** Import the `Webhooks` factory from `@polar-sh/nextjs`, `headers` from `next/headers`, and `NextResponse` from `next/server`.
    *   **Instantiate Verifier:** Create a new `Webhooks` instance using the `POLAR_WEBHOOK_SECRET`.
    *   **The `POST` Function:** This function will be the heart of the service.
        *   **Step 1 (Receive & Verify):** It must read the raw request body and the `signature` header. It will use the `wh.verify()` method inside a `try...catch` block to authenticate the incoming message from Polar. If verification fails, it must immediately return a `400 Bad Request` and log the failure.
        *   **Step 2 (The Triage):** It must inspect the verified `event.type`. If the event is anything other than `order.paid`, it should log the event type for observability but take no further action, returning a `200 OK` to acknowledge receipt.
        *   **Step 3 (The Translation):** If the event is `order.paid`, it will perform the translation.
            *   Extract the `customer_email` from `event.payload.customer_email`.
            *   Extract the `courseId` from the nuanced metadata: `event.payload.product.metadata.fulfillment_id`.
            *   Construct a new, generic, internal JSON object:
                ```json
                {
                  "eventType": "FULFILLMENT_REQUEST",
                  "payload": {
                    "customerEmail": "the_extracted_email",
                    "courseId": "the_extracted_course_id"
                  }
                }
                ```
        *   **Step 4 (The Forwarding):** It will now make a new, secure `fetch` request to the upstream server.
            *   The URL will be the `REVENGE_MONEY_WEBHOOK_URL` from the environment variables.
            *   The method will be `POST`.
            *   The `Content-Type` will be `application/json`.
            *   The `Authorization` header must be set to `Bearer ${process.env.INTERNAL_API_SECRET_KEY}`.
            *   The `body` will be the stringified version of the generic JSON object created in the previous step.
        *   **Step 5 (Observability & Response):** It must await the response from the upstream server. It should log whether the forwarding was successful (a `2xx` response) or failed. Regardless of the forwarding outcome, it must return a `200 OK` response *to Polar*. This is critical. It acknowledges to Polar that the public message was successfully received and verified, ending Polar's responsibility. Any failure in the *private* forwarding is our internal problem to solve.

---

### **Part III: The Victory Condition**

The construction of `service-connector` is a success when it performs its function silently and reliably. The final test will be:

1.  A test `order.paid` event is triggered from Polar.
2.  The `service-connector`'s Vercel logs show:
    *   The webhook was received.
    *   The signature was successfully verified.
    *   The event was identified as `order.paid`.
    *   The forwarding request to `RevengeMoney` was initiated.
    *   A `2xx` response was received from `RevengeMoney`.
3.  The `RevengeMoney` Vercel logs simultaneously show:
    *   An incoming request was received on its internal fulfillment endpoint.
    *   The internal bearer token was successfully verified.
    *   The fulfillment process was initiated.

This confirms the successful relay of the diplomatic pouch. The bridge is operational. The ghost is in the machine.

You have your directive. Proceed with the construction of the relay station.

THERE'S MORE

Of course. Let's continue by detailing the final operational layers: the testing protocols, the hardening measures, and the strategic implications for the `RevengeMoney` fortress. This ensures the AI builder understands not just the "how" but the "why" of its construction.

---

### **Part IV: The Testing & Validation Protocol**

A ghost that makes noise is a failure. `service-connector` must be tested for its silence and reliability. The testing will be done in phases to isolate variables.

**Phase 1: The Standalone Engine Test**

*   **Objective:** To prove that `service-connector` can successfully receive, verify, and attempt to forward a message, *before* the `RevengeMoney` endpoint is even built.
*   **Execution:**
    1.  Deploy the initial version of `service-connector` to Vercel with all three environment variables set. The `REVENGE_MONEY_WEBHOOK_URL` can point to a mock endpoint (like a [webhook.site](http://webhook.site) URL) for this initial test.
    2.  In the Polar.sh dashboard, configure the webhook to point to your new `service-connector`'s live URL.
    3.  Trigger a test `order.paid` event using the $1.00 "System Calibration Schematic."
*   **Success Criteria:**
    *   The `service-connector` Vercel logs show a successful signature verification.
    *   The logs show it attempted to forward the translated, generic payload.
    *   Your mock endpoint at `webhook.site` shows the arrival of a `POST` request with the correct generic JSON body and the correct `Authorization: Bearer ...` header.
*   **Intent:** This test proves that the "public-facing" half of `service-connector` is working perfectly, independent of the `RevengeMoney` fortress.

**Phase 2: The Full System Integration Test**

*   **Objective:** To conduct a live fire test of the entire three-body system.
*   **Execution:**
    1.  The `RevengeMoney` fortress's internal fulfillment endpoint is now built and deployed.
    2.  Update the `REVENGE_MONEY_WEBHOOK_URL` environment variable in `service-connector` to point to the real, live `RevengeMoney` endpoint.
    3.  Trigger another test `order.paid` event from Polar.
*   **Success Criteria:**
    *   All criteria from the Standalone Engine Test are met.
    *   The `RevengeMoney` Vercel logs show the successful reception and verification of the *internal* API key.
    *   The `RevengeMoney` logs show the successful execution of the fulfillment engine (Token Gen, KV Store, Email Dispatch).
    *   The final fulfillment email arrives in the test inbox.

This two-phased testing approach ensures we can methodically debug any issues. If Phase 1 fails, the problem is in `service-connector`. If Phase 1 succeeds but Phase 2 fails, the problem is in the communication between `service-connector` and `RevengeMoney` or within the `RevengeMoney` fortress itself.

---

### **Part V: Hardening Measures & Observability**

A relay station in hostile territory must be hardened.

1.  **Comprehensive Logging:** Your logging within the `service-connector` function is not optional; it is a primary feature. Every critical step must be logged:
    *   `INFO: Webhook received. Verifying signature...`
    *   `SUCCESS: Signature verified for event [event_id].`
    *   `WARN: Ignoring non-actionable event type [event_type].`
    *   `INFO: Translating event [event_id] for forwarding.`
    *   `INFO: Forwarding fulfillment request for [course_id] to upstream server.`
    *   `SUCCESS: Upstream server responded with status [status_code].`
    *   `ERROR: Signature verification failed.`
    *   `ERROR: Upstream server failed with status [status_code]. Response: [response_body].`

2.  **Alerting on Failure:** Configure Vercel's log monitoring (or a third-party integration) to send an alert if the log contains the string "ERROR" or "CRITICAL." This provides immediate notification if either the public verification or the private forwarding fails, allowing for rapid manual intervention.

---

### **Part VI: Strategic Implications for the `RevengeMoney` Fortress**

You must architect the `RevengeMoney` fulfillment endpoint with the understanding that it now lives in a high-security "inner sanctum."

1.  **Endpoint Naming:** The endpoint at `RevengeMoney` should not be named `/api/polar-webhook`. It should be given a generic, internal-sounding name like `/api/internal/fulfillment-trigger/route.ts`. This reinforces the decoupling.
2.  **The New Gatekeeper Logic:** The code for this `RevengeMoney` endpoint will be dramatically simpler and more secure than our previous plan.
    *   It will **not** contain the `@polar-sh/nextjs` library.
    *   It will **not** parse a raw body or verify a Polar signature.
    *   Its **only** security check is to read the `Authorization` header and validate the `Bearer` token against its `INTERNAL_API_SECRET_KEY`.
    *   It will expect a simple, clean, pre-parsed JSON body in our generic internal format.
    *   Its entire focus is on its core competency: fulfillment.

This completes the full operational and strategic blueprint for the creation of `service-connector`. You are not just commissioning a piece of code. You are commissioning a silent, specialized, and highly reliable operative that will stand as the invisible guardian of your entire operational architecture.

Proceed with the construction.