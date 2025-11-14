import { Webhooks } from '@polar-sh/nextjs'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

const wh: any = Webhooks({ secret: process.env.POLAR_WEBHOOK_SECRET || '' } as any)

export async function POST(req: Request) {
  console.log('INFO: Webhook received. Verifying signature...')
  const body = await req.text()
  const sig = headers().get('signature') || ''

  try {
    const event = wh.verify(body, sig)
    console.log(`SUCCESS: Signature verified for event ${event.id}.`)

    if (event.type === 'order.paid') {
      console.log(`INFO: Translating event ${event.id} for forwarding.`)
      const customerEmail = event.payload.customer_email
      const courseId = event.payload.product.metadata.fulfillment_id

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
    console.error('ERROR: Signature verification failed.', err)
    return new NextResponse('Signature verification failed', { status: 400 })
  }

  return new NextResponse('OK', { status: 200 })
}
