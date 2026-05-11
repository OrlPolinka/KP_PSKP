const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickFix() {
  try {
    // Проверяем, что клиенты есть в БД
    const clients = await prisma.user.findMany({ 
      where: { role: 'client' },
      select: { id: true, email: true, fullName: true, role: true, isActive: true }
    });
    
    console.log(`Найдено клиентов: ${clients.length}`);
    console.log('Первые 3 клиента:');
    clients.slice(0, 3).forEach(client => {
      console.log(`- ${client.fullName} (${client.email}) - ${client.role}`);
    });
    
    // Проверяем, что админ может их получить
    const admin = await prisma.user.findFirst({ where: { email: 'admin@dancestudio.ru' } });
    if (admin) {
      console.log(`\nАдмин найден: ${admin.fullName}`);
      console.log('API должен возвращать список клиентов...');
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Проверка завершена');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

quickFix();
