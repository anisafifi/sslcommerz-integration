import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { useCart } from '@/context/cart-context'
import { Product, products } from '@/data/products'
import { paths } from '@/routes/paths'
import Link from 'next/link'
import { toast } from 'sonner'

// Sample product data

export function ProductCard() {

  const { dispatch } = useCart()

  const handleAddToCart = (product : Product) => {
    dispatch({ type: 'ADD_ITEM', item: product })
    toast.success(`${product.title} added to cart!`)
  }

  return (
    <section className='w-full px-8 py-12'>
      <h2 className='mb-8 text-center text-2xl font-bold text-balance md:text-3xl'>Today's Best Deals For You!</h2>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:gap-6'>
        {products.map(product => (
          <Card
            key={product.id}
            className='flex flex-col gap-4 overflow-hidden rounded-lg py-4 shadow-none transition-shadow duration-300 hover:shadow-md'
          >
            <CardContent className='flex flex-1 flex-col gap-4 px-4'>
              <div className='aspect-square overflow-hidden'>
                <img
                  src={product.images[0].src}
                  alt={product.title}
                  className='size-full rounded-md object-contain'
                  loading='lazy'
                  width={400}
                  height={400}
                />
                <img
                  src='https://ui.shadcn.com/placeholder.svg'
                  alt='placeholder image'
                  className='rounded-md dark:brightness-[0.95] dark:invert'
                />
              </div>

              <div className='flex flex-1 flex-col'>

                  <h3 className='mb-1 font-medium text-balance'>{product.title}</h3>


                <div className='mt-auto flex items-baseline gap-2'>
                  <p className='font-semibold'>BDT {product.price.toFixed(2)}</p>
                  {product.originalPrice && (
                    <p className='text-muted-foreground text-sm line-through md:text-base xl:text-sm 2xl:text-base'>
                      ${product.originalPrice.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className='px-3 md:px-4 flex gap-2 '>

              <div className='flex-1 w-full flex flex-col gap-2'>
                <Link href={paths.checkout} >
                  <Button
                    onClick={() => handleAddToCart(product)}
                    variant='destructive'
                    className='w-full cursor-pointer text-sm'
                  >
                    Buy Now
                  </Button>
                </Link>
                <Button
                  variant='outline'
                  className='w-full cursor-pointer text-sm'
                  onClick={() => handleAddToCart(product)}
                >
                  Add to Cart
                </Button>
              </div>
              
            </CardFooter>

          </Card>
        ))}
      </div>
    </section>
  )
}
