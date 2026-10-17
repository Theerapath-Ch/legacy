import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "./db"
import {
    user,
    session,
    account,
    verification
} from "@/db/auth-schema"

import { Redis } from "ioredis"
import { redisStorage } from "@better-auth/redis-storage"

const redis = new Redis(process.env.REDIS_URL!)

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema: {
            user,
            session,
            account,
            verification
        }
    }),
    emailAndPassword: {
        enabled: true
    },

    secondaryStorage: redisStorage({
        client: redis,  
        keyPrefix: "legacy:better-auth:",
    }),

    session: {
        expiresIn: 60 * 60 * 24 * 30 * 6, // 6 เดือน
        updateAge: 60 * 60 * 24,
        storeSessionInDatabase:true
    },

    rateLimit: {
        enabled: true,
        window: 10,
        max: 100,
        storage: "secondary-storage",

        customRules: {
            "/sign-in/email": {
                window: 60,
                max: 5
            },

            "/sign-up/email": {
                window: 60,
                max: 5
            },

            "/forget-password": {
                window: 300,
                max: 3
            }
        }
    },

    advanced: {
        ipAddress: {
            ipAddressHeaders:["x-forwarded-for"],
            ipv6Subnet:64
        }
    },

    baseURL: process.env.BETTER_AUTH_URL,

})