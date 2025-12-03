import { PrismaClient } from "@prisma/client";

// ensure only a single instance of PrismaClient is used 
declare global {
  var __prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

export const prisma = global.__prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

export default prisma;
