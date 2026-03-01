
export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  images: { id: number; src: string; alt: string }[];
}

export const products: Product[] = [
  {
    id: 1,
    title: 'Wireless Headphones',
    slug: 'wireless-headphones',
    description: 'Premium noise‑cancelling experience',
    price: 349.0,
    originalPrice: 399.0,
    rating: 5,
    reviews: 121,
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
    ]
  },
  {
    id: 2,
    title: 'Smart Watch',
    slug: 'smart-watch',
    description: 'Health and fitness companion',
    price: 399.0,
    originalPrice: 449.0,
    rating: 5,
    reviews: 156,
    images: [
      {
        id: 1,
        src: '/products/product-2.png',
        alt: 'Smart Watch - View 1',
      },
    ],
  },
  {
    id: 3,
    title: 'Laptop Pro',
    slug: 'laptop-pro',
    description: 'Power and performance redefined',
    price: 1299.0,
    originalPrice: 1499.0,
    rating: 5,
    reviews: 89,
    images: [
      {
        id: 1,
        src: '/products/product-3.png',
        alt: 'Laptop Pro - View 1',
      },
    ],
  },
  {
    id: 4,
    title: 'RGB Keyboard',
    slug: 'rgb-keyboard',
    description: 'Mechanical RGB backlit keyboard',
    price: 159.0,
    originalPrice: 199.0,
    rating: 5,
    reviews: 92,
    images: [
      {
        id: 1,
        src: '/products/product-4.png',
        alt: 'RGB Keyboard - View 1',
      },
    ],
  },
  {
    id: 5,
    title: 'Gaming Monitor',
    slug: 'gaming-monitor',
    description: '144Hz refresh rate display',
    price: 699.0,
    originalPrice: 799.0,
    rating: 5,
    reviews: 78,
    images: [
      {
        id: 1,
        src: '/products/product-5.png',
        alt: 'Gaming Monitor - View 1',
      },
    ],
  },
  {
    id: 6,
    title: 'Smartphone Pro',
    slug: 'smartphone-pro',
    description: 'Pro camera system, ProMotion',
    price: 999.0,
    originalPrice: 1099.0,
    rating: 5,
    reviews: 245,
    images: [
      {
        id: 1,
        src: '/products/product-6.png',
        alt: 'Smartphone Pro - View 1',
      },
    ],
  },
  {
    id: 7,
    title: 'Bluetooth Speaker',
    slug: 'bluetooth-speaker',
    description: 'Portable wireless speaker with deep bass',
    price: 199.0,
    originalPrice: 249.0,
    rating: 5,
    reviews: 134,
    images: [
      {
        id: 1,
        src: '/products/product-7.png',
        alt: 'Bluetooth Speaker - View 1',
      },
    ],
  },
  {
    id: 8,
    title: 'Fitness Tracker',
    slug: 'fitness-tracker',
    description: 'Track your activity and health metrics',
    price: 149.0,
    originalPrice: 199.0,
    rating: 5,
    reviews: 112,
    images: [
      {
        id: 1,
        src: '/products/product-8.png',
        alt: 'Fitness Tracker - View 1',
      },
    ],
  },
  {
    id: 9,
    title: '4K Action Camera',
    slug: '4k-action-camera',
    description: 'Capture your adventures in stunning 4K',
    price: 299.0,
    originalPrice: 349.0,
    rating: 5,
    reviews: 67,
    images: [
      {
        id: 1,
        src: '/products/product-9.png',
        alt: '4K Action Camera - View 1',
      },
    ],
  },
  {
    id: 10,
    title: 'Wireless Earbuds',
    slug: 'wireless-earbuds',
    description: 'True wireless earbuds with long battery life',
    price: 149.0,
    originalPrice: 199.0,
    rating: 5,
    reviews: 189,
    images: [
      {
        id: 1,
        src: '/products/product-10.png',
        alt: 'Wireless Earbuds - View 1',
      },
    ],
  }
];