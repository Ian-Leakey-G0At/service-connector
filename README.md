# Fortress `service-connector`: The Intelligent Fulfillment Router

## I. The Strategic Mandate

`service-connector` is a silent, headless fortress that serves a single, critical function in our operational architecture: it acts as a high-performance **Intelligent Fulfillment Router**.

Its mission is to stand as a secure and discreet intermediary between the public-facing world and our private, internal services. It receives sensitive `order.paid` webhooks from our payment partner (Polar.sh), translates them into a standardized internal format, and routes them with precision to the correct upstream fortress—either `RevengeMoney` or `eggplant-method`.

This fortress operates on four core principles:
*   **Silence:** It presents no user interface to the outside world.
*   **Transience:** It is entirely stateless, holding no data after a transaction is processed.
*   **Specialization:** It performs one function—routing—and does it perfectly.
*   **Agnosticism:** Its internal message format is generic, ensuring upstream services remain decoupled from the payment provider.

## II. The Routing Mechanism

The core logic resides in a single API route (`/app/api/polar-webhook/route.ts`) that executes the following sequence:

1.  **Receipt & Triage:** The route listens for incoming webhooks from Polar.sh. It immediately triages the event, acting only on the `order.paid` signal.
2.  **Intelligent Routing:** The router inspects the `fulfillment_id` embedded in the webhook's metadata. This ID acts as the "map" to the correct destination.
    *   An ID prefixed with `guy-fawkes-` is routed to the `RevengeMoney` fortress.
    *   An ID prefixed with `eggplant-method-` is routed to the `Eggplant Method` fortress.
3.  **Secure Forwarding:** Once the destination is determined, `service-connector` forges a new, standardized `FULFILLMENT_REQUEST`. This request is then dispatched to the target's private webhook URL, authenticated with a shared secret bearer token.
4.  **Diagnostic Logging:** The fortress maintains a detailed log of its operations. It makes a critical distinction between a successful hand-off to an upstream service (a `200 OK` or `201 Created` response) and a `CRITICAL_UPSTREAM_FAILURE`, which is logged with high severity for immediate analysis.

## III. Configuration & Deployment

To function, `service-connector` requires five environment variables. A template is available in the `.env.example` file.

*   `POLAR_WEBHOOK_SECRET`: Used to verify the authenticity of incoming Polar.sh webhooks.
*   `REVENGE_MONEY_WEBHOOK_URL`: The private webhook URL for the `RevengeMoney` fortress.
*   `REVENGE_MONEY_INTERNAL_SECRET_KEY`: The shared secret used to authenticate with `RevengeMoney`.
*   `EGGPLANT_METHOD_WEBHOOK_URL`: The private webhook URL for the `Eggplant Method` fortress.
*   `EGGPLANT_METHOD_INTERNAL_SECRET_KEY`: The shared secret used to authenticate with `Eggplant Method`.

### Local Development

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment:**
    Create a `.env.local` file from the template.
    ```bash
    cp .env.example .env.local
    ```
    Populate the file with the necessary secrets.

3.  **Run the Server:**
    ```bash
    npm run dev
    ```

The service will be available at `http://localhost:3000`.
