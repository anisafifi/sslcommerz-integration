import { config } from "dotenv";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { products } from "../src/data/products";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Set it in .env or .env.local before running prisma:seed."
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.image.deleteMany();
    await tx.product.deleteMany();

    for (const product of products) {
      await tx.product.create({
        data: {
          title: product.title,
          slug: product.slug,
          description: product.description,
          price: product.price,
          originalPrice: product.originalPrice,
          rating: product.rating,
          reviews: product.reviews,
          images: {
            create: product.images.map((img) => ({
              src: img.src,
              alt: img.alt,
            })),
          },
        },
      });
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
