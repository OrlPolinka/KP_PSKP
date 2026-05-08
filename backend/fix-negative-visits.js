const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixNegativeVisits() {
    try {
        console.log('🔍 Поиск абонементов с отрицательным remainingVisits...');
        
        // Находим все абонементы с отрицательным remainingVisits
        const negativeMemberships = await prisma.membership.findMany({
            where: {
                remainingVisits: {
                    lt: 0
                }
            }
        });

        console.log(`📊 Найдено ${negativeMemberships.length} абонементов с отрицательными значениями`);

        if (negativeMemberships.length === 0) {
            console.log('✅ Абонементов с отрицательными значениями не найдено');
            return;
        }

        // Исправляем каждый абонемент
        for (const membership of negativeMemberships) {
            console.log(`🔧 Исправление абонемента ID: ${membership.id}, remainingVisits: ${membership.remainingVisits}`);
            
            await prisma.membership.update({
                where: { id: membership.id },
                data: {
                    remainingVisits: 0,
                    status: 'expired'
                }
            });
            
            console.log(`✅ Абонемент ID: ${membership.id} исправлен`);
        }

        console.log('🎉 Все абонементы с отрицательными значениями исправлены');
        
    } catch (error) {
        console.error('❌ Ошибка при исправлении:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixNegativeVisits();
