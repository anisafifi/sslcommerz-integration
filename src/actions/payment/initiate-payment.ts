'use server'

import { z } from 'zod'
import { CONFIG } from '@/global-config'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { InitiatePaymentResponse, SSLCommerzEnv } from '@/types/payment-types'
import { products } from '@/data/products'
import { initiatePayment } from './sslcommerz'
import { headers } from 'next/headers'

// ─── Input schema (mirrors checkout form) ─────────────────────────────────

const checkoutSchema = z.object({
  email: z.string().email({ message: 'Valid email is required' }).optional(),
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().optional(),
  phone: z.string().min(1, { message: 'Phone number is required' }),
  address: z.string().min(1, { message: 'Address is required' }),
  city: z.string().min(1, { message: 'Thana/Upazila is required' }),
  state: z.string().min(1, { message: 'District is required' }),
  promoCode: z.string().optional(),
})

type CheckoutFormData = z.infer<typeof checkoutSchema> & {
  saveInfo?: boolean
  newsletter?: boolean
}

type CartItemInput = {
  id: number | string
  variant?: string
  quantity: number
}

type OrderSummaryInput = {
  items: CartItemInput[]
}

type ServerPricedCartItem = {
  id: number
  name: string
  variant?: string
  price: number
  quantity: number
}

const SHIPPING_FEE = 120.00
const TAX_RATE = 0.07

// ─── Return type (discriminated union) ────────────────────────────────────

type InitiatePaymentResult =
  | { status: 'SUCCESS'; GatewayPageURL: string; orderId: string }
  | { status: 'VALIDATION_ERROR'; errors: Record<string, string> }
  | { status: 'FAILED'; message: string }

// ─── Action ───────────────────────────────────────────────────────────────

export async function sslInitiatePayment(
  formData: CheckoutFormData,
  env: string = 'sandbox',
  orderSummary: OrderSummaryInput,
): Promise<InitiatePaymentResult> {

  const requestHeaders = await headers()
  const request = new Request('http://localhost', { headers: requestHeaders })

  if (await rateLimit(request)) {
    return {
      status: 'FAILED',
      message: 'Too many requests. Please wait a moment and try again.',
    }
  }

  // ── 1. Server-side validation ────────────────────────────────────────────

  const parsed = checkoutSchema.safeParse(formData)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    parsed.error.issues.forEach(issue => {
      const field = issue.path[0] as string
      if (field && !errors[field]) errors[field] = issue.message
    })
    return { status: 'VALIDATION_ERROR', errors }
  }

  const { email, firstName, lastName, phone, address, city, state, promoCode } = parsed.data

  // ── 2. Compute totals ────────────────────────────────────────────────────

  if (orderSummary.items.length === 0) {
    return {
      status: 'FAILED',
      message: 'Cart is empty.',
    }
  }

  const serverPricedItems: ServerPricedCartItem[] = []

  for (const item of orderSummary.items) {
    const productId = Number(item.id)

    if (!Number.isInteger(productId) || productId <= 0) {
      return {
        status: 'FAILED',
        message: 'Invalid cart item.',
      }
    }

    const quantity = Math.floor(item.quantity)
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return {
        status: 'FAILED',
        message: 'Invalid item quantity.',
      }
    }

    const product = products.find(p => p.id === productId)

    if (!product) {
      return {
        status: 'FAILED',
        message: 'One or more cart items are invalid.',
      }
    }

    serverPricedItems.push({
      id: product.id,
      name: product.title,
      variant: item.variant,
      price: product.price,
      quantity,
    })
  }

  const subtotal = serverPricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingAmount = SHIPPING_FEE
  const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2))
  const discountAmount = 0
  const promoDiscountAmount = 0

  const totalAmount = parseFloat(
    (
      subtotal +
      shippingAmount +
      taxAmount -
      discountAmount -
      promoDiscountAmount
    ).toFixed(2),
  )

  const cusName = `${firstName} ${lastName ?? ''}`.trim()

  // ── 3. Unique transaction ID ─────────────────────────────────────────────

  const tranId = `TXN_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`

  // ── 4. Persist order inside a Prisma transaction ─────────────────────────

  let orderId: string

  try {
    
    // All DB operations are wrapped in a transaction to ensure atomicity.
    const order = await prisma.$transaction(async tx => {

      // 4a. Upsert customer — only when email is provided
      const customer = email
        ? await tx.customer.upsert({
            where: { email },
            update: {
              firstName,
              lastName: lastName ?? '',
              phone,
            },
            create: {
              email,
              firstName,
              lastName: lastName ?? '',
              phone,
            },
          })
        : null

      // 4b. Shipping address snapshot
      const shippingAddress = await tx.address.create({
        data: {
          customerId: customer?.id ?? null,
          name:       cusName,
          add1:       address,
          city,         // Thana/Upazila → address.city
          state,        // District      → address.state
          postcode:   '',
          country:    'BD',
        },
      })

      // 4c. Order row — field names match schema exactly
      const newOrder = await tx.order.create({
        data: {
          tranId,
          customerId:      customer?.id ?? null,
          status:          'PENDING',

          subtotal,
          shippingAmount,
          taxAmount,
          discountAmount,
          promoDiscount:   promoDiscountAmount,
          convenienceFee:  0,
          vatAmount:       0,
          totalAmount,
          currency:        'BDT',

          promoCode:       promoCode ?? null,

          // Customer snapshot at time of order
          cusName,
          cusEmail:        email ?? '',
          cusPhone:        phone,

          // Address FKs
          shippingAddressId: shippingAddress.id,
          billingAddressId:  null,

          // SSLCommerz pass-through — echoed back in IPN
          valueA: tranId,  // updated below after we have the id
          valueB: tranId,
          valueC: null,
          valueD: null,

          productCategory: 'general',
          productProfile:  'general',
        },
      })

      // 4d. Patch valueA with the real order id now that we have it
      await tx.order.update({
        where: { id: newOrder.id },
        data:  { valueA: newOrder.id },
      })

      // 4e. Order items — price snapshot
      await tx.orderItem.createMany({
        data: serverPricedItems.map(item => ({
          orderId:     newOrder.id,
          productId:   null,
          variantId:   null,
          productName: item.name,
          variantName: item.variant ?? null,
          sku:         null,
          quantity:    item.quantity,
          unitPrice:   item.price,
          totalPrice:  parseFloat((item.price * item.quantity).toFixed(2)),
        })),
      })

      // 4f. Payment record — INITIATED, session key added after SSL responds
      await tx.payment.create({
        data: {
          orderId:    newOrder.id,
          sessionKey: null,
          status:     'INITIATED',
        },
      })

      return newOrder
    })

    orderId = order.id

  } catch (dbError) {
    console.error('[sslInitiatePayment] DB error:', dbError)
    return {
      status:  'FAILED',
      message: 'Failed to save order. Please try again.',
    }
  }

  // ── 5. Call SSLCommerz session API ───────────────────────────────────────

  let sslResponse: InitiatePaymentResponse

  try {
    sslResponse = await initiatePayment(
      {
        store_id:     CONFIG.storeId,
        store_passwd: CONFIG.storePassword,

        total_amount: totalAmount,
        currency:     'BDT',
        tran_id:      tranId,

        success_url: `${CONFIG.appUrl}/payment/success?tran_id=${tranId}`,
        fail_url:    `${CONFIG.appUrl}/payment/fail?tran_id=${tranId}`,
        cancel_url:  `${CONFIG.appUrl}/payment/cancel?tran_id=${tranId}`,
        ipn_url:     `${CONFIG.appUrl}/api/payment/ipn`,

        product_name:     serverPricedItems.map(i => i.name).join(', ').slice(0, 255),
        product_category: 'general',
        product_profile:  'general',
        product_amount:   subtotal,
        vat:              taxAmount,
        shipping_method:  'NO',

        cus_name:     cusName,
        cus_email:    email ?? `guest_${tranId}@noemail.com`,
        cus_add1:     address,
        cus_city:     city,
        cus_state:    state,
        cus_postcode: '1000',
        cus_country:  'Bangladesh',
        cus_phone:    phone,

        // Echoed back verbatim in IPN — use value_a to find the DB order
        value_a: orderId,
        value_b: tranId,

        cart: serverPricedItems.map(item => ({
          product:    item.name.slice(0, 255),
          quantity:   String(item.quantity),
          amount:     item.price.toFixed(2),
          unit_price: item.price.toFixed(2),
        })),
      },
      env as SSLCommerzEnv,
      request,
    )
  } catch (sslError) {
    console.error('[sslInitiatePayment] SSLCommerz error:', sslError)

    // Don't leave the order as PENDING — mark it failed
    await prisma.order.update({
      where: { id: orderId },
      data:  { status: 'FAILED' },
    })

    return {
      status:  'FAILED',
      message: 'Payment gateway unreachable. Please try again.',
    }
  }

  // ── 6. Handle SSLCommerz rejection ──────────────────────────────────────

  if (sslResponse.status !== 'SUCCESS' || !sslResponse.GatewayPageURL) {
    await prisma.order.update({
      where: { id: orderId },
      data:  { status: 'FAILED' },
    })

    return {
      status:  'FAILED',
      message: sslResponse.failedreason ?? 'Payment gateway rejected the request.',
    }
  }

  // ── 7. Persist the session key returned by SSLCommerz ───────────────────

  if (sslResponse.sessionkey) {
    await prisma.payment.updateMany({
      where: {
        orderId,
        status:     'INITIATED',
        sessionKey: null,
      },
      data: { sessionKey: sslResponse.sessionkey },
    })
  }

  // ── 8. Advance order to PROCESSING ──────────────────────────────────────

  await prisma.order.update({
    where: { id: orderId },
    data:  { status: 'PROCESSING' },
  })

  // ── 9. Return gateway URL to the client ─────────────────────────────────

  return {
    status: 'SUCCESS',
    GatewayPageURL: sslResponse.GatewayPageURL,
    orderId,
  }
}