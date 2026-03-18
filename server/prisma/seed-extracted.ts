import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding extracted NCO occupations...\n');

    const dataPath = path.join(__dirname, 'nco-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const occupations = JSON.parse(rawData);

    let created = 0;
    let skipped = 0;

    for (const occ of occupations) {
        const existing = await prisma.occupation.findUnique({
            where: { ncoCode: occ.ncoCode },
        });

        if (existing) {
            skipped++;
            continue;
        }

        const occupation = await prisma.occupation.create({
            data: occ,
        });

        // Create initial service stats for this occupation
        await prisma.serviceStats.create({
            data: {
                occupationId: occupation.id,
                requestsLast30Days: Math.floor(Math.random() * 20) + 1,
                providersAvailable: Math.floor(Math.random() * 10) + 1,
                demandRatio: 1.0,
            },
        });

        created++;
        if (created % 100 === 0) {
            console.log(`  ✅ Progress: ${created} created so far...`);
        }
    }

    console.log(`\n📊 Summary: ${created} created, ${skipped} skipped (already exist)`);
    console.log('✅ Occupation seeding complete!');
}

seed()
    .catch((error) => {
        console.error('❌ Seed error:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
