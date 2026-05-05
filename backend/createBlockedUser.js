const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createBlockedUser() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const blockedUser = await prisma.user.create({
    data: {
      email: 'blocked@test.ru',
      password: hashedPassword,
      fullName: 'Заблокированный Тест',
      phone: '+7(999)999-99-99',
      role: 'client',
      isActive: false
    }
  });
  
  console.log('Создан заблокированный пользователь:', blockedUser.email);
  await prisma.$disconnect();
}

createBlockedUser().catch(console.error);