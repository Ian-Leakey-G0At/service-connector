import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  console.log('INFO: Webhook received. Verifying signature...')
  const body = await req.text()
  const sig = headers().get('signature')

  const secret = process.env.POLAR_WEBHOOK_SECRET
  if (!secret) {
    console.error('CRITICAL: POLAR_WEBHOOK_SECRET is not set.')
    return new NextResponse('Configuration error', { status: 500 })
  }

  // 1. **The Secret Handshake**: This remains our first line of defense.
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig!), Buffer.from(expectedSignature))) {
      throw new Error('Invalid signature')
    }
  } catch {
    console.error('ERROR: Signature verification failed.')
    return new NextResponse('Signature verification failed', { status: 400 })
  }

  // 2. **The Black Box Protocol - In Action**:
  // We abandon the fight for perfect types from the library. We parse the body into a generic 'any' object.
  let event: any;
  try {
    event = JSON.parse(body)
  } catch (err) {
    console.error('ERROR: Failed to parse event body', err)
    return new NextResponse('Invalid event body', { status: 400 })
  }

  console.log(`SUCCESS: Signature verified for event type: ${event.type || 'unknown'}.`)

  // 3. **The Triage & EXPLICIT RUNTIME VALIDATION**:
  if (event.type === 'order.paid') {
    try {
      console.log(`INFO: Translating 'order.paid' event for forwarding.`)

      // Instead of trusting types, we manually verify the payload's structure.
      const payload = event.payload
      const customerEmail = payload?.customer_email
      const courseId = payload?.product?.metadata?.fulfillment_id

      if (typeof customerEmail !== 'string' || typeof courseId !== 'string') {
        console.error('ERROR: Runtime validation failed. Webhook payload for order.paid has a malformed or missing structure.')
        // We return 200 OK because the webhook itself was valid, but the payload was unusable.
        return new NextResponse('Webhook processed, but payload was malformed.', { status: 200 })
      }

      // From this point on, we can trust that `customerEmail` and `courseId` are strings.

      // 4. **The Translation**:
      const internalPayload = {
        eventType: 'FULFILLMENT_REQUEST',
        payload: {
          customerEmail,
          courseId,
        },
      }

      console.log(`INFO: Forwarding fulfillment request for ${courseId} to upstream server.`)

      // 5. **The Forwarding**:
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

  // 6. **The Acknowledgment**:
  return new NextResponse('OK', { status: 200 })
}
