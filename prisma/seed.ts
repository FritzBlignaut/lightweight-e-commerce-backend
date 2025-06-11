import { PrismaClient, Role } from '../generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // --- Seed Users ---
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password,
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password,
      role: Role.CUSTOMER,
    },
  });

  // --- Seed Products ---
  await prisma.product.createMany({
    data: [
      {
        name: 'Gaming Mouse',
        description: 'RGB mouse with high DPI',
        price: 59.99,
        stock: 100,
      },
      {
        name: 'Mechanical Keyboard',
        description: 'Blue switches, RGB lighting',
        price: 89.99,
        stock: 75,
      },
      {
        name: 'HD Monitor',
        description: '24-inch Full HD monitor',
        price: 129.99,
        stock: 50,
      },
    ],
  });

  console.log('✅ Seeded users and products.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
