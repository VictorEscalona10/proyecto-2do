// Script de prueba para verificar que el logging automático funciona
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        console.log('🧪 Probando sistema de logging automático...\n');

        // 1. Verificar conexión
        await prisma.$connect();
        console.log('✅ Conexión a BD exitosa');

        // 2. Contar logs actuales
        const logsAntes = await prisma.dbLog.count();
        console.log(`📊 Logs existentes: ${logsAntes}`);

        // 3. Crear una categoría de prueba
        console.log('\n🔨 Creando categoría de prueba...');
        const categoria = await prisma.category.create({
            data: {
                name: `Test_${Date.now()}`,
            },
        });
        console.log(`✅ Categoría creada: ID ${categoria.id}`);

        // 4. Esperar un momento para que se registre el log
        await new Promise(resolve => setTimeout(resolve, 500));

        // 5. Verificar que se creó un log
        const logsDespues = await prisma.dbLog.count();
        console.log(`📊 Logs después de crear: ${logsDespues}`);

        if (logsDespues > logsAntes) {
            console.log('\n✅ ¡ÉXITO! El logging automático está funcionando');

            // Mostrar el último log
            const ultimoLog = await prisma.dbLog.findFirst({
                orderBy: { createdAt: 'desc' },
            });
            console.log('\n📝 Último log registrado:');
            console.log(JSON.stringify(ultimoLog, null, 2));
        } else {
            console.log('\n❌ ERROR: No se registró el log automáticamente');
        }

        // 6. Limpiar
        await prisma.category.delete({ where: { id: categoria.id } });
        console.log('\n🧹 Limpieza completada');

    } catch (error) {
        console.error('❌ Error en la prueba:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
