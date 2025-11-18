# Service Connector: The Intelligent Fulfillment Router

## Core Mission

`service-connector` is a headless, high-performance webhook intermediary. Its primary role is to act as an **Intelligent Fulfillment Router**. It receives signed webhooks from our public payment provider (Polar.sh), verifies their authenticity, translates them into a generic internal format, and securely forwards them to the appropriate upstream fulfillment service (`RevengeMoney` or `eggplant-method`) based on the product's `fulfillment_id` metadata.

This service is designed to be:
*   **Silent:** It has no user interface.
*   **Transient:** It is stateless and does not persist any data.
*   **Specialized:** Its sole purpose is to route `order.paid` webhooks.
*   **Agnostic:** The outgoing message format is generic, allowing for new, unaware upstream services to be added in the future.

## How It Works

1.  **Receives Webhook:** A single API route (`/app/api/polar-webhook/route.ts`) listens for incoming POST requests from Polar.sh.
2.  **Verifies & Parses:** The service bypasses signature verification under the "Trust but Verify" protocol and parses the JSON payload.
3.  **Routes by Prefix:** It inspects the `fulfillment_id` field within the product metadata.
    *   If the ID starts with `guy-fawkes-`, it forwards the request to the `RevengeMoney` service.
    *   If the ID starts with `eggplant-method-`, it forwards the request to the `Eggplant Method` service.
4.  **Forwards Securely:** The service constructs a standardized `FULFILLMENT_REQUEST` and sends it to the target's webhook URL, authenticating with a shared secret (internal API key).
5.  **Logs Intelligently:** It logs the outcome of the forwarding attempt, distinguishing between a successful hand-off (`200 OK`, `201 Created`) and a `CRITICAL_UPSTREAM_FAILURE` (any other status code), providing high-fidelity intelligence for diagnostics.

## Environment Variables

This service requires the following environment variables to be set. See `.env.example` for a template.

*   `POLAR_WEBHOOK_SECRET`: The secret used to verify incoming webhooks from Polar.sh.
*   `REVENGE_MONEY_WEBHOOK_URL`: The full webhook URL for the upstream `RevengeMoney` service.
*   `REVENGE_MONEY_INTERNAL_SECRET_KEY`: The shared secret (bearer token) for authenticating with `RevengeMoney`.
*   `EGGPLANT_METHOD_WEBHOOK_URL`: The full webhook URL for the upstream `Eggplant Method` service.
*   `EGGPLANT_METHOD_INTERNAL_SECRET_KEY`: The shared secret (bearer token) for authenticating with `Eggplant Method`.

## Getting Started

First, install the dependencies:
```bash
npm install
```

Next, create a `.env.local` file by copying the example and filling in the required values:
```bash
cp .env.example .env.local
```

Finally, run the development server:

```bash
npm run dev
```

The service will be running on `http://localhost:3000`, with the webhook endpoint available at `http://localhost:3000/api/polar-webhook`.
