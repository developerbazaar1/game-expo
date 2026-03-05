import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
    console.log("Database URL from process.env:", process.env.DATABASE_URL);
    console.log("Attempting to connect to database...");
    try {
        const events = await prisma.event.findMany();
        console.log("SUCCESS: Connection established.");
        console.log("Events found:", events.length);
    }
    catch (error) {
        console.error("FAILURE: Database connection failed.");
        console.error(error);
    }
    finally {
        await prisma.$disconnect();
    }
}
test();
//# sourceMappingURL=test-db.js.map