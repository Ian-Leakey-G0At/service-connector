import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
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

// The Triage: Act only on the signal we care about.
if (event.type === 'order.paid') {
try {
console.log(`INFO: Translating 'order.paid' event for forwarding.`)

const payload = event.payload
const customerEmail = payload?.customer_email
const courseId = payload?.product?.metadata?.fulfillment_id

// Runtime validation remains critical.
if (typeof customerEmail !== 'string' || typeof courseId !== 'string') {
console.error('ERROR: Runtime validation failed. Webhook payload for order.paid has a malformed or missing structure.')
return new NextResponse('Webhook processed, but payload was malformed.', { status: 200 })
}

const internalPayload = {
eventType: 'FULFILLMENT_REQUEST',
payload: {
customerEmail,
courseId,
},
}

console.log(`INFO: Forwarding fulfillment request for ${courseId} to upstream server.`)

const response = await fetch(process.env.REVENGE_MONEY_WEBHOOK_URL!, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
Authorization: `Bearer ${process.env.INTERNAL_API_SECRET_KEY!}`,
},
body: JSON.stringify(internalPayload),
})

if (response.ok) {
console.log(`SUCCESS: Upstream server responded with status ${response.status}.`)
} else {
const responseBody = await response.text()
console.error(`ERROR: Upstream server failed with status ${response.status}. Response: ${responseBody}.`)
}
} catch (err) {
console.error('ERROR: Processing/forwarding of order.paid event failed.', err)
}
} else {
console.log(`WARN: Ignoring non-actionable event type ${event.type}.`)
}

// Acknowledgment is still crucial.
return new NextResponse('OK', { status: 200 })
}
