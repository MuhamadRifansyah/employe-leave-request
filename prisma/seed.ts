import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.leaveRequest.deleteMany();
  await prisma.employee.deleteMany();

  // Create employees with leave balance
  const emp1 = await prisma.employee.create({
    data: {
      name: "Budi Santoso",
      department: "Engineering",
      position: "Senior Developer",
      leaveBalance: 12,
    },
  });

  const emp2 = await prisma.employee.create({
    data: {
      name: "Siti Rahayu",
      department: "Marketing",
      position: "Marketing Manager",
      leaveBalance: 7,
    },
  });

  const emp3 = await prisma.employee.create({
    data: {
      name: "Ahmad Fauzi",
      department: "Engineering",
      position: "Junior Developer",
      leaveBalance: 12,
    },
  });

  const emp4 = await prisma.employee.create({
    data: {
      name: "Dewi Lestari",
      department: "Human Resources",
      position: "HR Specialist",
      leaveBalance: 11,
    },
  });

  const emp5 = await prisma.employee.create({
    data: {
      name: "Rudi Hartono",
      department: "Finance",
      position: "Accountant",
      leaveBalance: 3,
    },
  });

  console.log(`✅ Created ${5} employees`);

  // Create leave requests with various statuses
  await prisma.leaveRequest.createMany({
    data: [
      {
        employeeId: emp1.id,
        startDate: "2026-07-01",
        endDate: "2026-07-05",
        reason: "Family vacation to Bali",
        status: "PENDING",
      },
      {
        employeeId: emp2.id,
        startDate: "2026-06-20",
        endDate: "2026-06-22",
        reason: "Medical appointment and recovery",
        status: "APPROVED",
      },
      {
        employeeId: emp3.id,
        startDate: "2026-06-25",
        endDate: "2026-06-27",
        reason: "Personal matters that need attention",
        status: "PENDING",
      },
      {
        employeeId: emp4.id,
        startDate: "2026-06-15",
        endDate: "2026-06-16",
        reason: "Sick leave due to flu symptoms",
        status: "REJECTED",
      },
      {
        employeeId: emp5.id,
        startDate: "2026-07-10",
        endDate: "2026-07-14",
        reason: "Annual leave for family reunion",
        status: "APPROVED",
      },
      {
        employeeId: emp1.id,
        startDate: "2026-08-01",
        endDate: "2026-08-02",
        reason: "Moving to a new apartment",
        status: "CANCELLED",
      },
    ],
  });

  console.log(`✅ Created ${6} leave requests`);
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
