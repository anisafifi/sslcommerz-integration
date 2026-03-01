'use client';

import { StorefrontHero } from "./storefront-hero";
import { ProductCard } from "./product-card";

export default function HomeView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-300 flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <StorefrontHero />
        <ProductCard />
      </main>
    </div>
  );
}
