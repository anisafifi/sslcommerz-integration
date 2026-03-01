
export const paths = {

    root: '/',
    cart: '/cart',
    checkout: '/checkout',
    products: '/products',
    product: (slug: string) => `/products/${slug}`,
    category: '/category/:id',
}
