import { PrismaClient } from "@prisma/client";
import { DatabaseError } from "../frameworks";
import makePlannerDb from "./db";

const makeDb = new PrismaClient();

const plannerDb = makePlannerDb({ makeDb, DatabaseError });

export { plannerDb, makeDb };
