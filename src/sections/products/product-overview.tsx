'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Heart, Star } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel'

interface Product {
  id: string
  brand: string
  name: string
  description: string
  price: number
  currency: string
  rating: number
  images: {
    id: number
    src: string
    alt: string
  }[]
  sizes: number[]
  colors: {
    name: string
    value: string
  }[]
}

const productDetails: Product = {
  id: 'high-tops-black',
  brand: 'Adidas',
  name: 'Black technical knit fabric high-tops',
  description: 'Running sneakers with thin elastic laces.',
  price: 450,
  currency: '$',
  rating: 4,
  images: [
    {
      id: 1,
      src: 'https://images.unsplash.com/photo-1633437143567-87c8ef9aa34f?w=600&h=600&fit=crop',
      alt: 'Black technical knit fabric high-tops - View 1',
    },
    {
      id: 2,
      src: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600&h=600&fit=crop',
      alt: 'Black technical knit fabric high-tops - View 2',
    },
    {
      id: 3,
      src: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=600&fit=crop',
      alt: 'Black technical knit fabric high-tops - View 3',
    },
    {
      id: 4,
      src: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=600&fit=crop',
      alt: 'Black technical knit fabric high-tops - View 4',
    },
  ],
  sizes: [37, 38, 39, 40, 41],
  colors: [
    { name: 'White', value: '#FFFFFF' },
    { name: 'Black', value: '#000000' },
    { name: 'Gray', value: '#6B7280' },
  ],
}

export function ProductOverview() {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState<number | null>(productDetails.sizes[0])
  const [selectedColor, setSelectedColor] = useState(productDetails.colors[0])
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()

  useEffect(() => {
    if (!carouselApi) return

    // Set carousel to the selected image
    carouselApi.scrollTo(selectedImage)

    // Update selected image when carousel changes
    const handleSelect = () => {
      const currentIndex = carouselApi.selectedScrollSnap()
      setSelectedImage(currentIndex)
    }

    carouselApi.on('select', handleSelect)
    return () => {
      carouselApi.off('select', handleSelect)
    }
  }, [carouselApi, selectedImage])

  return (
    <div>
      {/* Product Details */}
      <section className='@container mx-auto max-w-7xl'>
        <div className='grid grid-cols-1 gap-6 p-4 lg:grid-cols-2 lg:gap-8 lg:p-6 xl:grid-cols-3 xl:gap-12 xl:p-12'>
          {/* Product Info */}
          <div className='flex flex-col justify-between gap-6 lg:gap-8'>
            <div className='space-y-2 lg:space-y-4'>
              <span className='text-sm font-semibold tracking-wide uppercase'>{productDetails.brand} —</span>
              <h2 className='text-xl font-bold tracking-tight text-balance lg:text-3xl'>{productDetails.name}</h2>
              <p className='text-muted-foreground text-balance'>{productDetails.description}</p>
              <p className='text-2xl font-bold tracking-tight'>
                {productDetails.currency}
                {productDetails.price}
              </p>
            </div>

            {/* Thumbnails */}
            <div className='flex flex-wrap gap-4'>
              {productDetails.images.map((image, index) => (
                <div
                  key={image.id}
                  onMouseEnter={() => setSelectedImage(index)}
                  className={cn(
                    'ring-offset-background size-16 cursor-pointer overflow-hidden rounded-sm ring-offset-2 transition-all lg:size-18',
                    selectedImage === index && 'ring-foreground ring-2',
                  )}
                >
                  <img src={image.src} alt={image.alt} className='size-full object-cover' />
                </div>
              ))}
            </div>
          </div>

          {/* Main Image */}
          <div className='row-span-2 row-start-1 aspect-square lg:col-start-2'>
            <Carousel setApi={setCarouselApi} className='size-full'>
              <CarouselContent>
                {productDetails.images.map(image => (
                  <CarouselItem key={image.id}>
                    <img src={image.src} alt={image.alt} className='size-full rounded-lg object-cover' />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Product Attributes */}
          <div className='flex flex-col gap-6 lg:gap-10'>
            {/* Size Selection */}
            <div className='space-y-2'>
              <h3 className='font-bold'>Sizes</h3>
              <div className='flex flex-wrap gap-3'>
                {productDetails.sizes.map(size => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? 'default' : 'outline'}
                    onClick={() => setSelectedSize(size)}
                    className='size-12 cursor-pointer rounded-full p-0'
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className='space-y-2'>
              <h3 className='font-bold'>Color</h3>
              <div className='flex space-x-3'>
                {productDetails.colors.map(color => (
                  <Button
                    key={color.name}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'ring-offset-background size-8 cursor-pointer rounded-full ring-offset-2 transition-all',
                      selectedColor.name === color.name && 'ring-foreground ring-2',
                      selectedColor.name !== color.name &&
                        ['Black', 'White'].includes(color.name) &&
                        'outline-muted outline-solid',
                    )}
                    style={{ backgroundColor: color.value }}
                    aria-label={`Select ${color.name} color`}
                  />
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className='space-y-2'>
              <h3 className='font-bold'>Reviews</h3>
              <div className='flex space-x-1'>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className='text-foreground size-5'
                    fill={i < productDetails.rating ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-4'>
              <Button className='flex-1 cursor-pointer rounded-full' size='lg'>
                Add to Cart
              </Button>
              <Button
                variant='outline'
                size='icon'
                className='rounded-full cursor-pointer'
                onClick={() => setIsWishlisted(!isWishlisted)}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={cn('size-5', isWishlisted && 'fill-primary text-primary')} />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
