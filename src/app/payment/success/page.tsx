// IMPORTANT: Never trust the redirect params alone.
// Always load the order from your own DB using tran_id.
// The params are only used as a lookup key.

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CheckCircle, Package, CreditCard, MapPin, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { paths } from '@/routes/paths'

// SSLCommerz sends these as query params on success redirect
type SuccessSearchParams = {
  tran_id?: string
  val_id?: string
  amount?: string
  card_type?: string
  bank_tran_id?: string
  status?: string
}

type Props = {
  searchParams: Promise<SuccessSearchParams>
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const params = await searchParams
  const tranId = params.tran_id

  // No tran_id in URL → can't look anything up
  if (!tranId) redirect(paths.root)

  // ── Load order from DB — single source of truth ──────────────────────────

  const order = await prisma.order.findUnique({
    where: { tranId },
    include: {
      items: true,
      payments: {
        where: {
          status: { in: ['VALID', 'VALIDATED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      shippingAddress: true,
    },
  })

  // Order not found or not in a paid/processing state → reject
  if (!order || (order.status !== 'PAID' && order.status !== 'PROCESSING')) {
    redirect('/payment/fail')
  }

  const payment = order.payments[0]
  const isRisky = payment?.riskLevel === 1

  return (
    <div className='min-h-screen bg-muted/30 py-12'>
      <div className='mx-auto max-w-2xl px-4 space-y-6'>

        {/* ── Header ── */}
        <div className='text-center space-y-2'>
          <div className='flex justify-center'>
            <CheckCircle className='size-16 text-green-500' strokeWidth={1.5} />
          </div>
          <h1 className='text-2xl font-bold tracking-tight'>
            {isRisky ? 'Payment Received — Under Review' : 'Payment Confirmed!'}
          </h1>
          <p className='text-muted-foreground text-sm'>
            {isRisky
              ? 'Your payment is being reviewed. We will confirm your order shortly.'
              : `Thank you for your order. We'll start processing it right away.`}
          </p>
          {order.cusEmail && (
            <p className='text-muted-foreground text-xs'>
              A confirmation will be sent to <span className='font-medium text-foreground'>{order.cusEmail}</span>
            </p>
          )}
        </div>

        {/* ── Order reference ── */}
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-xs text-muted-foreground'>Order reference</p>
                <p className='font-mono text-sm font-medium'>{order.tranId}</p>
              </div>
              <Badge variant={order.status === 'PAID' ? 'default' : 'secondary'}>
                {order.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* ── Payment details ── */}
        {payment && (
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <CreditCard className='size-4' />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 text-sm'>
              <Row label='Status'>
                <Badge variant={payment.status === 'VALID' || payment.status === 'VALIDATED' ? 'default' : 'secondary'}>
                  {payment.status}
                </Badge>
              </Row>
              {payment.cardType && (
                <Row label='Paid via'>{payment.cardType}</Row>
              )}
              {payment.cardBrand && (
                <Row label='Card brand'>{payment.cardBrand}</Row>
              )}
              {payment.cardNo && (
                <Row label='Card number'>{payment.cardNo}</Row>
              )}
              {payment.bankTranId && (
                <Row label='Bank transaction ID'>
                  <span className='font-mono text-xs'>{payment.bankTranId}</span>
                </Row>
              )}
              {payment.tranDate && (
                <Row label='Transaction date'>
                  {new Date(payment.tranDate).toLocaleString('en-BD', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </Row>
              )}
              {payment.riskTitle && isRisky && (
                <Row label='Risk status'>
                  <span className='text-yellow-600 font-medium'>{payment.riskTitle}</span>
                </Row>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Order items ── */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base flex items-center gap-2'>
              <Package className='size-4' />
              Items Ordered
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
              {parseFloat(order.discountAmount.toString()) > 0 && (
                <Row label='Discount'>
                  − ৳{parseFloat(order.discountAmount.toString()).toFixed(2)}
                </Row>
              )}
              {parseFloat(order.promoDiscount.toString()) > 0 && (
                <Row label='Promo discount'>
                  − ৳{parseFloat(order.promoDiscount.toString()).toFixed(2)}
                </Row>
              )}
            </div>

            <Separator />

            <div className='flex justify-between font-semibold'>
              <span>Total Paid</span>
              <span>৳{parseFloat(order.totalAmount.toString()).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* ── Shipping address ── */}
        {order.shippingAddress && (
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <MapPin className='size-4' />
                Delivering To
              </CardTitle>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground space-y-0.5'>
              {order.shippingAddress.name && (
                <p className='font-medium text-foreground'>{order.shippingAddress.name}</p>
              )}
              <p>{order.shippingAddress.add1}</p>
              {order.shippingAddress.add2 && <p>{order.shippingAddress.add2}</p>}
              <p>
                {[
                  order.shippingAddress.city,
                  order.shippingAddress.state,
                  order.shippingAddress.postcode,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p>{order.shippingAddress.country}</p>
            </CardContent>
          </Card>
        )}

        {/* ── Receipt note ── */}
        <div className='flex items-start gap-2 rounded-lg border p-4 text-sm text-muted-foreground'>
          <Receipt className='size-4 shrink-0 mt-0.5' />
          <p>
            Keep your order reference <span className='font-mono font-medium text-foreground'>{order.tranId}</span> for
            any future queries about this order.
          </p>
        </div>

      </div>
    </div>
  )
}

// ─── Small layout helper ───────────────────────────────────────────────────

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