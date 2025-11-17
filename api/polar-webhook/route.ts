import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
// This initial block remains the same.
console.log('INFO: Webhook received. Bypassing signature verification as per "Trust but Verify" protocol.')

let event: any;
try {
const body = await req.text()
event = JSON.parse(body)
} catch (err) {
console.error('ERROR: Failed to parse event body', err)
return new NextResponse('Invalid event body', { status: 400 })
}

console.log(`INFO: Event received for type: ${event.type || 'unknown'}.`)

if (event.type === 'order.paid') {
try {
console.log(`INFO: Translating 'order.paid' event for forwarding.`)

const payload = event.data
const customerEmail = payload?.customer?.email
const courseId = payload?.product?.metadata?.fulfillment_id

// --- START OF THE ENHANCED INTERROGATION BLOCK ---

let validationError = null;
if (typeof customerEmail !== 'string' || !customerEmail) {
validationError = "Customer email is missing or not a string.";
} else if (typeof courseId !== 'string' || !courseId) {
validationError = "Product metadata 'fulfillment_id' is missing or not a string.";
}

if (validationError) {
console.error('ERROR: Runtime validation failed.');
console.error(`DIAGNOSTIC REASON: ${validationError}`);
// Log the entire metadata object for undeniable proof.
console.error('DIAGNOSTIC PAYLOAD METADATA:', payload?.product?.metadata);
return new NextResponse('Webhook processed, but payload was malformed.', { status: 200 });
}

// --- END OF THE ENHANCED INTERROGATION BLOCK ---

// The rest of the Intelligent Router logic is perfect and remains.
let targetWebhookUrl: string | undefined;
let internalApiKey: string | undefined;

console.log(`ROUTING: Inspecting fulfillment_id: [${courseId}]`);

if (courseId.startsWith('guy-fawkes-')) {
targetWebhookUrl = process.env.REVENGE_MONEY_WEBHOOK_URL;
internalApiKey = process.env.REVENGE_MONEY_INTERNAL_SECRET_KEY;
console.log(`ROUTING: Detected RevengeMoney product.`);
} else if (courseId.startsWith('eggplant-method-')) {
targetWebhookUrl = process.env.EGGPLANT_METHOD_WEBHOOK_URL;
internalApiKey = process.env.EGGPLANT_METHOD_INTERNAL_SECRET_KEY;
console.log(`ROUTING: Detected Eggplant Method product.`);
} else {
console.warn(`ROUTING_FAIL: Unrecognized fulfillment_id prefix: [${courseId}]. Halting process.`);
return new NextResponse('OK', { status: 200 });
}

if (!targetWebhookUrl || !internalApiKey) {
console.error(`CRITICAL CONFIGURATION ERROR: Missing webhook URL or API key for route target. Check environment variables.`);
return new NextResponse('Internal server configuration error.', { status: 500 });
}

const internalPayload = {
eventType: 'FULFILLMENT_REQUEST',
payload: {
customerEmail,
courseId,
},
}

console.log(`INFO: Forwarding fulfillment request for ${courseId} to: ${targetWebhookUrl}`);

const response = await fetch(targetWebhookUrl, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
Authorization: `Bearer ${internalApiKey}`,
},
body: JSON.stringify(internalPayload),
})

if (response.ok) {
console.log(`SUCCESS: Upstream server at ${targetWebhookUrl} responded with status ${response.status}.`)
} else {
const responseBody = await response.text()
console.error(`ERROR: Upstream server at ${targetWebhookUrl} failed with status ${response.status}. Response: ${responseBody}.`)
}
} catch (err) {
console.error('ERROR: Processing/forwarding of order.paid event failed.', err)
}
} else {
console.log(`WARN: Ignoring non-actionable event type ${event.type}.`)
}

return new NextResponse('OK', { status: 200 })
}
