import prisma from './src/utils/prisma';
import bcrypt from 'bcryptjs';

async function fix() {
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const staffHash = await bcrypt.hash('Staff@123', 12);
  const custHash = await bcrypt.hash('Customer@123', 12);

  await prisma.user.updateMany({ where: { role: 'admin' }, data: { password: adminHash } });
  await prisma.user.updateMany({ where: { role: 'staff' }, data: { password: staffHash } });
  await prisma.user.updateMany({ where: { role: 'customer' }, data: { password: custHash } });

  console.log('✅ Passwords successfully normalized:');
  console.log('   Admin:    Admin@123');
  console.log('   Staff:    Staff@123');
  console.log('   Customer: Customer@123');

  // Verify
  const staff1 = await prisma.user.findUnique({ where: { email: 'staff1@brightloop.com' } });
  const match = await bcrypt.compare('Staff@123', staff1!.password);
  console.log('   Verification staff1 match:', match);
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
