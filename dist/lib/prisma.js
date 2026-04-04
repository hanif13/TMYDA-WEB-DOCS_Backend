"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrisma = exports.prisma = void 0;
const client_1 = require("@prisma/client");
exports.prisma = global.prisma || new client_1.PrismaClient();
if (process.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
/**
 * Compatibility helper for the migration from the Hono context.
 * In Express/Node.js, we use the singleton prisma instance directly.
 */
const getPrisma = (databaseUrl) => {
    return exports.prisma;
};
exports.getPrisma = getPrisma;
