/* eslint-disable @typescript-eslint/no-require-imports */
import "dotenv/config";

export default {
  schema: "prisma/schema.prisma",
  datasource: {
    name: "db",
    url: process.env.DATABASE_URL,
  },
};
