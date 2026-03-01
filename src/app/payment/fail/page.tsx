"use server";

// SSLCommerz redirects here when payment fails or is cancelled.
// Same rule as success: only use tran_id from params as a lookup key,
// display everything from your own DB.

import { prisma } from '@/lib/prisma'
import { XCircle, AlertTriangle, Package, RefreshCcw, ShoppingCart, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { paths } from '@/routes/paths'
import { redirect } from 'next/navigation'

type FailSearchParams = {
  tran_id?: string
  status?: string   // FAILED | CANCELLED | UNATTEMPTED | EXPIRED
  error?: string
}

type Props = {
  searchParams: Promise<FailSearchParams>
}

// ─── Status config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { heading: string; description: string; icon: 'x' | 'alert' }
> = {
  FAILED: {
    heading: 'Payment Failed',
    description:
      'Your payment was declined by the bank. No money has been charged. Please try a different card or payment method.',
    icon: 'x',
  },
  CANCELLED: {
    heading: 'Payment Cancelled',
    description:
      'You cancelled the payment. Your order has not been placed. You can try again whenever you are ready.',
    icon: 'alert',
  },
  UNATTEMPTED: {
    heading: 'Payment Not Completed',
    description:
      'You left the payment page before completing the transaction. No money has been charged.',
    icon: 'alert',
  },
  EXPIRED: {
    heading: 'Payment Session Expired',
    description:
      'The payment session timed out before the transaction was completed. Please start a new checkout.',
    icon: 'alert',
  },
}

const DEFAULT_STATUS_CONFIG = {
  heading: 'Payment Unsuccessful',
  description:
    'Something went wrong during payment. No money has been charged. Please try again.',
  icon: 'x' as const,
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function PaymentFailPage({ searchParams }: Props) {
  const params = await searchParams
  const tranId       = params.tran_id
  const statusParam  = params.status?.toUpperCase()

  
    // No tran_id in URL → can't look anything up
    if (!tranId) redirect(paths.root)

  // ── Load order from DB if we have a tran_id ──────────────────────────────

  const order = tranId
    ? await prisma.order.findUnique({
        where: { tranId },
        include: {
          items: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })
    : null

  // Resolve which status label to use:
  // 1. Payment record status (most accurate)
  // 2. Query param status (from SSL redirect)
  // 3. Order status fallback
  const rawStatus =
    order?.payments[0]?.status ??
    statusParam ??
    order?.status ??
    'FAILED'

  const config = STATUS_CONFIG[rawStatus] ?? DEFAULT_STATUS_CONFIG
  const payment = order?.payments[0]

  return (
    <div className='min-h-screen bg-muted/30 py-12'>
      <div className='mx-auto max-w-2xl px-4 space-y-6'>

        {/* ── Header ── */}
        <div className='text-center space-y-2'>
          <div className='flex justify-center'>
            {config.icon === 'x' ? (
              <XCircle className='size-16 text-destructive' strokeWidth={1.5} />
            ) : (
              <AlertTriangle className='size-16 text-yellow-500' strokeWidth={1.5} />
            )}
          </div>
          <h1 className='text-2xl font-bold tracking-tight'>{config.heading}</h1>
          <p className='text-muted-foreground text-sm max-w-md mx-auto'>
            {config.description}
          </p>
        </div>

        {/* ── Order reference (if available) ── */}
        {order && (
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-muted-foreground'>Order reference</p>
                  <p className='font-mono text-sm font-medium'>{order.tranId}</p>
                </div>
                <Badge variant='destructive'>{order.status}</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Payment attempt details ── */}
        {payment && (payment.cardType || payment.bankTranId || payment.tranDate) && (
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <Receipt className='size-4' />
                Attempt Details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <Row label='Status'>
                <Badge variant='secondary'>{payment.status}</Badge>
              </Row>
              {payment.cardType && (
                <Row label='Payment method'>{payment.cardType}</Row>
              )}
              {payment.cardBrand && (
                <Row label='Card brand'>{payment.cardBrand}</Row>
              )}
              {payment.bankTranId && (
                <Row label='Bank reference'>
                  <span className='font-mono text-xs'>{payment.bankTranId}</span>
                </Row>
              )}
              {payment.tranDate && (
                <Row label='Attempted at'>
                  {new Date(payment.tranDate).toLocaleString('en-BD', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Row>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Items that were in the order ── */}
        {order && order.items.length > 0 && (
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <Package className='size-4' />
                Items in Your Order
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {order.items.map((item) => (
                <div key={item.id} className='flex justify-between text-sm'>
                  <div className='min-w-0'>
                    <p className='font-medium truncate'>{item.productName}</p>
                    {item.variantName && (
                      <p className='text-muted-foreground text-xs'>{item.variantName}</p>
                    )}
                    <p className='text-muted-foreground text-xs'>Qty: {item.quantity}</p>
                  </div>
                  <p className='font-medium shrink-0 pl-4'>
                    ৳{parseFloat(item.totalPrice.toString()).toFixed(2)}
                  </p>
                </div>
              ))}

              <Separator />

              <div className='space-y-1.5 text-sm'>
                <Row label='Subtotal'>
                  ৳{parseFloat(order.subtotal.toString()).toFixed(2)}
                </Row>
                <Row label='Shipping'>
                  ৳{parseFloat(order.shippingAmount.toString()).toFixed(2)}
                </Row>
                <Row label='Tax'>
                  ৳{parseFloat(order.taxAmount.toString()).toFixed(2)}
                </Row>
              </div>

              <Separator />

              <div className='flex justify-between font-semibold text-sm'>
                <span>Order Total</span>
                <span>৳{parseFloat(order.totalAmount.toString()).toFixed(2)}</span>
              </div>

              <p className='text-xs text-muted-foreground pt-1'>
                Your cart items are still saved. You can retry payment below.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── What to do next ── */}
        <Card className='border-muted'>
          <CardContent className='pt-6 space-y-2 text-sm text-muted-foreground'>
            <p className='font-medium text-foreground'>What you can do:</p>
            <ul className='space-y-1 list-disc list-inside'>
              <li>Check that your card details and billing address are correct</li>
              <li>Make sure your card has sufficient funds</li>
              <li>Try a different card or mobile banking option</li>
              <li>Contact your bank if the problem persists</li>
            </ul>
          </CardContent>
        </Card>

        {/* ── CTAs ── */}
        <div className='flex flex-col sm:flex-row gap-3'>
          <Button asChild className='flex-1 gap-2'>
            <Link href='/checkout'>
              <RefreshCcw className='size-4' />
              Try Again
            </Link>
          </Button>
          <Button asChild variant='outline' className='flex-1 gap-2'>
            <Link href='/'>
              <ShoppingCart className='size-4' />
              Back to Shop
            </Link>
          </Button>
        </div>

      </div>
    </div>
  )
}

// ─── Layout helper ────────────────────────────────────────────────────────

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className='flex justify-between items-center gap-4'>
      <span className='text-muted-foreground shrink-0'>{label}</span>
      <span className='text-right'>{children}</span>
    </div>
  )
}