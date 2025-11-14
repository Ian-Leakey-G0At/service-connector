import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

const POLAR_SECRET = process.env.POLAR_WEBHOOK_SECRET || ''

function normalizeSignatureHeader(sigHeader: string) {
  // header formats vary; try to extract a usable hex/base64 signature
  let sig = sigHeader.trim()
  // if comma-separated (multiple values), pick the last token that contains '=' or looks like a signature
  if (sig.includes(',')) {
    const parts = sig.split(',').map((s) => s.trim())
    sig = parts[parts.length - 1]
  }
  // If contains key=value, take the value (e.g. "sha256=<hex>")
  if (sig.includes('=')) {
    const parts = sig.split('=')
    sig = parts[parts.length - 1]
  }
  return sig
}

function verifySignature(body: string, sigHeader: string, secret: string): boolean {
  if (!secret) return false
  if (!sigHeader) return false

  const sig = normalizeSignatureHeader(sigHeader)

  // compute expected HMAC (hex)
  const expected = createHmac('sha256', secret).update(body).digest('hex')

  try {
    const sigBuf = Buffer.from(sig, 'hex')
    const expectedBuf = Buffer.from(expected, 'hex')
    if (sigBuf.length !== expectedBuf.length) return false
    return timingSafeEqual(sigBuf, expectedBuf)
  } catch (e) {
    // if not hex, try base64
    try {
      const sigBuf = Buffer.from(sig, 'base64')
      const expectedBuf = Buffer.from(expected, 'hex')
      if (sigBuf.length !== expectedBuf.length) return false
      return timingSafeEqual(sigBuf, expectedBuf)
    } catch (e2) {
      return false
    }
  }
}

export async function POST(req: Request) {
  console.log('INFO: Webhook received. Verifying signature...')
  const body = await req.text()
  const sig = headers().get('signature') || headers().get('x-signature') || ''

  if (!verifySignature(body, sig, POLAR_SECRET)) {
    console.error('ERROR: Signature verification failed.')
    return new NextResponse('Signature verification failed', { status: 400 })
  }

  let event: any
  try {
    event = JSON.parse(body)
  } catch (err) {
    console.error('ERROR: Failed to parse event body', err)
    return new NextResponse('Invalid event body', { status: 400 })
  }

  console.log(`SUCCESS: Signature verified for event ${event?.id || '<unknown>'}.`)

  try {
    if (event?.type === 'order.paid') {
      console.log(`INFO: Translating event ${event.id} for forwarding.`)
      const customerEmail = event.payload?.customer_email
      const courseId = event.payload?.product?.metadata?.fulfillment_id

      const internalPayload = {
        eventType: 'FULFILLMENT_REQUEST',
        payload: {
          customerEmail,
          courseId,
        },
      }

      console.log(`INFO: Forwarding fulfillment request for ${courseId} to upstream server.`)

      const response = await fetch(process.env.REVENGE_MONEY_WEBHOOK_URL || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.INTERNAL_API_SECRET_KEY}`,
        },
        body: JSON.stringify(internalPayload),
      })

      if (response.ok) {
        console.log(`SUCCESS: Upstream server responded with status ${response.status}.`)
      } else {
        const responseBody = await response.text()
        console.error(`ERROR: Upstream server failed with status ${response.status}. Response: ${responseBody}.`)
      }
    } else {
      console.log(`WARN: Ignoring non-actionable event type ${event.type}.`)
    }
  } catch (err) {
    console.error('ERROR: Processing/forwarding failed.', err)
  }

  return new NextResponse('OK', { status: 200 })
}
