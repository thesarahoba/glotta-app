import { PrismaClient, Role, PaymentPlanType, PaymentInterval } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo seller
  const hashedPassword = await bcrypt.hash('password123', 10);

  const seller = await prisma.user.upsert({
    where: { email: 'kiki@example.com' },
    update: {},
    create: {
      email: 'kiki@example.com',
      password: hashedPassword,
      name: 'Kiki Hair',
      phone: '08012345678',
      role: Role.SELLER,
      storeName: 'Kiki Hair Store',
      storeSlug: 'kikihair',
      storeDesc: 'Premium hair extensions delivered to your door.',
    },
  });

  console.log('✅ Seller created:', seller.email);

  // Create a demo product (fixed plan)
  const product = await prisma.product.upsert({
    where: { id: 'demo-product-1' },
    update: {},
    create: {
      id: 'demo-product-1',
      name: 'Bone Straight Wig',
      description: '28 inch bone straight wig, full density, Swiss lace.',
      price: 200000,
      planType: PaymentPlanType.FIXED,
      installmentAmount: 10000,
      interval: PaymentInterval.WEEKLY,
      durationCount: 20,
      lockFunds: true,
      sellerId: seller.id,
    },
  });

  console.log('✅ Product created:', product.name);

  // Create a demo buyer
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      password: hashedPassword,
      name: 'Ada Okonkwo',
      phone: '09087654321',
      role: Role.BUYER,
    },
  });

  console.log('✅ Buyer created:', buyer.email);

  // Create a demo wallet
  const wallet = await prisma.wallet.upsert({
    where: { buyerId_productId: { buyerId: buyer.id, productId: product.id } },
    update: {},
    create: {
      totalPrice: 200000,
      amountPaid: 50000,
      balance: 150000,
      progressPercent: 25,
      buyerName: 'Ada Okonkwo',
      buyerPhone: '09087654321',
      buyerAddress: '12 Lekki Phase 1, Lagos',
      quantity: 1,
      buyerId: buyer.id,
      productId: product.id,
      points: 50,
    },
  });

  console.log('✅ Wallet created for:', wallet.buyerName);

  console.log('\n🎉 Seed complete!');
  console.log('   Seller login: kiki@example.com / password123');
  console.log('   Buyer login:  buyer@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
