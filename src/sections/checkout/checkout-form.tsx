'use client'

import * as z from 'zod'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { CreditCard, DollarSign, Gift, Shield, Tag, Truck } from 'lucide-react'
import { CONFIG } from '@/global-config'
import { useCart } from '@/context/cart-context'
import { sslInitiatePayment } from '@/actions/payment/initiate-payment'

// ─── Constants ─────────────────────────────────────────────────────────────

const SHIPPING_FEE = 15.99
const TAX_RATE = 0.07 // 7%

// ─── Schema ────────────────────────────────────────────────────────────────

const checkoutSchema = z.object({
  email: z.string().email({ message: 'Email is required' }).optional(),
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().optional(),
  phone: z.string().min(1, { message: 'Phone number is required' }),
  address: z.string().min(1, { message: 'Address is required' }),
  city: z.string().min(1, { message: 'Thana/Upazila is required' }),
  state: z.string().min(1, { message: 'District is required' }),
  promoCode: z.string().optional(),
})

type FormData = {
  email: string | undefined
  firstName: string
  lastName: string | undefined
  phone: string
  address: string
  city: string
  state: string
  saveInfo: boolean
  newsletter: boolean
  promoCode: string
}

// ─── Component ─────────────────────────────────────────────────────────────

export function CheckoutForm() {
  const { state, dispatch } = useCart()

  const [formData, setFormData] = useState<FormData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    saveInfo: false,
    newsletter: false,
    promoCode: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isLoading, setIsLoading] = useState(false)

  // ── Derived totals from cart context
  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = parseFloat((subtotal * TAX_RATE).toFixed(2))
  const total = subtotal + SHIPPING_FEE + tax

  // ── Handlers

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error on change
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handlePayment = async () => {
    const isValid = validateForm()
    if (!isValid) return

    setIsLoading(true)

    try {
      const result = await sslInitiatePayment(
        formData,
        CONFIG.paymentEnv,
        {
          items: state.items.map(item => ({
            id: item.id,
            name: item.title,
            variant: item.description,
            price: item.price,
            quantity: item.quantity,
          })),
          shipping: SHIPPING_FEE,
          tax,
          discount: 0,
          promoDiscount: 0,
        },
      )

      switch (result.status) {
        case 'SUCCESS':

          dispatch({ type: 'CLEAR_CART' })
          // Order saved + session created → redirect to SSLCommerz
          window.location.href = result.GatewayPageURL
          break

        case 'VALIDATION_ERROR':
          // Should not happen (form validates first) but handle defensively
          setErrors(result.errors as Partial<Record<keyof FormData, string>>)
          break

        case 'FAILED':
          // Show a toast or inline error
          console.error('Payment failed:', result.message)
          // e.g. toast.error(result.message)
          break
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  function validateForm(): boolean {
    const result = checkoutSchema.safeParse(formData)

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {}

      result.error.issues.forEach(err => {
        const field = err.path[0] as keyof FormData
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = err.message
        }
      })

      setErrors(fieldErrors)
      return false
    }

    setErrors({})
    return true
  }


  return (
    <div className='grid gap-8 lg:grid-cols-3'>

      {/* ── Left: Form Cards */}
      <div className='lg:col-span-2 space-y-8'>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className='text-balance'>Contact Information</CardTitle>
            <CardDescription>We'll use this to send you order updates</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='firstName'>First name</Label>
                <Input
                  id='firstName'
                  placeholder='John'
                  value={formData.firstName}
                  onChange={e => handleInputChange('firstName', e.target.value)}
                  className='mt-2'
                />
                {errors.firstName && <span className='text-red-500 text-xs'>{errors.firstName}</span>}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='lastName'>Last name</Label>
                <Input
                  id='lastName'
                  placeholder='Doe'
                  value={formData.lastName}
                  onChange={e => handleInputChange('lastName', e.target.value)}
                  className='mt-2'
                />
                {errors.lastName && <span className='text-red-500 text-xs'>{errors.lastName}</span>}
              </div>
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email address</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='john@example.com'
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className='mt-2'
                />
                {errors.email && <span className='text-red-500 text-xs'>{errors.email}</span>}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='phone'>Phone number (optional)</Label>
                <Input
                  id='phone'
                  type='tel'
                  placeholder='+880 1XXXXXXXXX'
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  className='mt-2'
                />
                {errors.phone && <span className='text-red-500 text-xs'>{errors.phone}</span>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader>
            <CardTitle className='text-balance'>Shipping Address</CardTitle>
            <CardDescription>Where should we deliver your order?</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='address'>Street address</Label>
              <Input
                id='address'
                placeholder='123 Main Street'
                value={formData.address}
                onChange={e => handleInputChange('address', e.target.value)}
                className='mt-2'
              />
              {errors.address && <span className='text-red-500 text-xs'>{errors.address}</span>}
            </div>

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='city'>Thana/Upazila</Label>
                <Input
                  id='city'
                  placeholder='Dhaka'
                  value={formData.city}
                  onChange={e => handleInputChange('city', e.target.value)}
                  className='mt-2'
                />
                {errors.city && <span className='text-red-500 text-xs'>{errors.city}</span>}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='state'>District</Label>
                <Input
                  id='state'
                  placeholder='Dhaka'
                  value={formData.state}
                  onChange={e => handleInputChange('state', e.target.value)}
                  className='mt-2'
                />
                {errors.state && <span className='text-red-500 text-xs'>{errors.state}</span>}
              </div>
            </div>

            <div className='flex justify-end pt-4'>
              <Button
                onClick={handlePayment}
                disabled={isLoading || state.items.length === 0}
                className='flex cursor-pointer items-center gap-2'
              >
                <CreditCard className='size-4' />
                {isLoading ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── Right: Order Summary */}
      <div className='lg:col-span-1'>
        <Card className='sticky top-8'>
          <CardHeader>
            <CardTitle className='text-balance'>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>

            {/* Cart Items */}
            {state.items.length === 0 ? (
              <p className='text-muted-foreground text-sm text-center py-4'>Your cart is empty</p>
            ) : (
              <div className='space-y-4'>
                {state.items.map(item => (
                  <div key={item.id} className='flex gap-4'>
                    <div className='relative'>
                      <img
                        src={item.images[0].src}
                        alt={item.title}
                        className='h-16 w-16 rounded-lg object-cover'
                      />
                      <Badge
                        variant='secondary'
                        className='absolute -inset-e-2 -top-2 size-6 rounded-full p-0 text-xs'
                      >
                        {item.quantity}
                      </Badge>
                    </div>
                    <div className='min-w-0 flex-1'>
                      <h4 className='truncate text-sm font-medium'>{item.title}</h4>
                      <p className='text-muted-foreground text-xs line-clamp-1'>{item.description}</p>
                      <p className='mt-1 text-sm font-medium'>BDT {item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            {/* Promo Code */}
            <div className='space-y-2'>
              <Label htmlFor='promoCode' className='text-sm'>Promo code</Label>
              <div className='flex gap-2'>
                <Input
                  id='promoCode'
                  placeholder='Enter code'
                  value={formData.promoCode}
                  onChange={e => handleInputChange('promoCode', e.target.value)}
                />
                <Button variant='outline' className='cursor-pointer'>Apply</Button>
              </div>
            </div>

            <Separator />

            {/* Pricing Breakdown */}
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Subtotal</span>
                <span>BDT {subtotal.toFixed(2)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground flex items-center gap-1'>
                  <Truck className='size-3' />
                  Shipping
                </span>
                <span>BDT {SHIPPING_FEE.toFixed(2)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Tax</span>
                <span>BDT {tax.toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            <div className='flex justify-between font-semibold'>
              <span>Total</span>
              <span>BDT {total.toFixed(2)}</span>
            </div>

            {/* Trust Indicators */}
            <div className='space-y-3 pt-4'>
              <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                <Shield className='size-4 text-green-600' />
                <span>SSL encrypted checkout</span>
              </div>
              <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                <Truck className='size-4 text-blue-600' />
                <span>Free shipping on orders over BDT 75</span>
              </div>
              <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                <Gift className='size-4 text-purple-600' />
                <span>30-day return policy</span>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

    </div>
  )
}