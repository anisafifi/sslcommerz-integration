// SSLCommerz redirects here when the customer explicitly closes or
// cancels the payment window before completing the transaction.

import { prisma } from '@/lib/prisma'
import { Ban, Package, ShoppingCart, ArrowLeft, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type CancelSearchParams = {
  tran_id?: string
}

type Props = {
  searchParams: Promise<CancelSearchParams>
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function PaymentCancelPage({ searchParams }: Props) {
  const params = await searchParams
  const tranId = params.tran_id

  // ── Load order from DB ───────────────────────────────────────────────────

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

  // Mark order as CANCELLED if it isn't already settled
  if (order && order.status === 'PROCESSING') {
    await prisma.order.update({
      where: { id: order.id },
      data:  { status: 'CANCELLED' },
    })
  }

  const payment = order?.payments[0]

  return (
    <div className='min-h-screen bg-muted/30 py-12'>
      <div className='mx-auto max-w-2xl px-4 space-y-6'>

        {/* ── Header ── */}
        <div className='text-center space-y-2'>
          <div className='flex justify-center'>
            <Ban className='size-16 text-muted-foreground' strokeWidth={1.5} />
          </div>
          <h1 className='text-2xl font-bold tracking-tight'>Payment Cancelled</h1>
          <p className='text-muted-foreground text-sm max-w-md mx-auto'>
            You cancelled the payment. No money has been charged and your order
            has not been placed. You can complete your
            purchase whenever you are ready.
          </p>
        </div>

        {/* ── Order reference ── */}
        {order && (
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs text-muted-foreground'>Order reference</p>
                  <p className='font-mono text-sm font-medium'>{order.tranId}</p>
                </div>
                <Badge variant='secondary'>CANCELLED</Badge>
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

        {/* ── Items still in order ── */}
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
                Your cart is still saved. Head back to checkout to complete your purchase.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── CTAs ── */}
        <div className='flex flex-col sm:flex-row gap-3'>
          <Button asChild className='flex-1 gap-2'>
            <Link href='/checkout'>
              <ArrowLeft className='size-4' />
              Back to Checkout
            </Link>
          </Button>
          <Button asChild variant='outline' className='flex-1 gap-2'>
            <Link href='/'>
              <ShoppingCart className='size-4' />
              Continue Shopping
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