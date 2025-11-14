import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  console.log('INFO: Webhook received. Initiating verification protocol.')
  const body = await req.text()
  const receivedSignature = headers().get('signature')

  const secret = process.env.POLAR_WEBHOOK_SECRET
  if (!secret) {
    console.error('CRITICAL FAILURE: POLAR_WEBHOOK_SECRET is not set in the environment.')
    return new NextResponse('Configuration error', { status: 500 })
  }

  // --- START OF DIAGNOSTIC BLOCK ---
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  console.log(`DIAGNOSTIC: Received Signature -> [${receivedSignature}]`)
  console.log(`DIAGNOSTIC: Expected Signature -> [${expectedSignature}]`)
  // --- END OF DIAGNOSTIC BLOCK ---

  let isSignatureValid = false;
  try {
    // Use timingSafeEqual for security, but ensure buffers are the same length first
    const receivedBuf = Buffer.from(receivedSignature!);
    const expectedBuf = Buffer.from(expectedSignature);
    if (receivedBuf.length === expectedBuf.length) {
        isSignatureValid = crypto.timingSafeEqual(receivedBuf, expectedBuf);
    }
  } catch {
    // This catch block handles cases where the signature format is invalid
    isSignatureValid = false;
  }

  if (!isSignatureValid) {
    console.error('ERROR: Signature verification failed. Received and Expected signatures do not match.')
    return new NextResponse('Signature verification failed', { status: 400 })
  }
  
  // ... [The rest of the code (The Triage, Translation, Forwarding) remains exactly the same] ...
  // Parse the event, check for 'order.paid', create internal payload, forward, etc.
  // We are only modifying the verification block.

  let event: any;
  try {
    event = JSON.parse(body)
  } catch (err) {
    console.error('ERROR: Failed to parse event body', err)
    return new NextResponse('Invalid event body', { status: 400 })
  }

  console.log(`SUCCESS: Signature verified for event type: ${event.type}.`)

  if (event.type === 'order.paid') {
    // ... [FULFILLMENT LOGIC HERE] ...
  } else {
    console.log(`WARN: Ignoring non-actionable event type ${event.type}.`)
  }

  return new NextResponse('OK', { status: 200 })
}