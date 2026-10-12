import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { financialAccount } from "@/db/business-schema"
import { eq, and } from "drizzle-orm"
import { headers } from "next/headers"
import { z } from "zod"
import { auditLog } from "@/db/business-schema"
import { v7 as uuidv7 } from "uuid";
import { updateFinancialAccountSchema } from "@/lib/validation"

const accountIdSchema = z.uuid()

export const GET = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    //console.log("session", session)

    if (!session) {
        return Response.json(
            { error: "Unauthorized" },
            { status: 401 }
        )
    }

    const { id } = await params
    console.log("id", id)
    const idResult = accountIdSchema.safeParse(id)

    if (!idResult.success) {
        return Response.json(
            { error: "Invalid account id" },
            { status: 400 }
        )
    }

    const [account] = await db.select({
        id: financialAccount.id,
        //userId: financialAccount.userId,
        bankId: financialAccount.bankId,
        name: financialAccount.name,
        customBankName: financialAccount.customBankName,
        accountNumberLast4: financialAccount.accountNumberLast4,
        accountType: financialAccount.accountType,
        currency: financialAccount.currency,
        status: financialAccount.status,
        note: financialAccount.note,
        createdAt: financialAccount.createdAt,
        updatedAt: financialAccount.updatedAt
    })
        .from(financialAccount)
        .where(
            and(
                eq(financialAccount.id, idResult.data),
                eq(financialAccount.userId, session.user.id)
            ),
        )
        .limit(1)

    if (!account) {
        return Response.json(
            { error: "Financial account not found" },
            { status: 404 }
        )
    }


    return Response.json(
        {
            message: "Financial account retrieved",
            data: account
        },
        { status: 200 }
    )
}

export const PATCH = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        return Response.json(
            { error: "Unauthorized" },
            { status: 401 }
        )
    }

    const { id } = await params
    const idResult = accountIdSchema.safeParse(id)

    if (!idResult.success) {
        return Response.json(
            { error: "Invalid account id" },
            { status: 400 }
        )
    }

    let body: unknown
    try {
        body = await req.json()
    } catch (error) {
        return Response.json(
            { error: "Invalid request body" },
            { status: 400 }
        )
    }

    const result = updateFinancialAccountSchema.safeParse(body)

    if (!result.success) {
        return Response.json(
            {
                error: "Validation failed",
                detail: result.error.issues
            },
            { status: 400 }
        )
    }

    const data = result.data
    const userId = session.user.id

    const updatedAccount = await db.transaction(async (tx) => {
        const [before] = await tx.select({
            id: financialAccount.id,
            bankId: financialAccount.bankId,
            name: financialAccount.name,
            customBankName: financialAccount.customBankName,
            accountNumberLast4: financialAccount.accountNumberLast4,
            accountType: financialAccount.accountType,
            currency: financialAccount.currency,
            status: financialAccount.status,
            note: financialAccount.note,
            createdAt: financialAccount.createdAt,
            updatedAt: financialAccount.updatedAt,
        }).from(financialAccount)
            .where(
                and(
                    eq(financialAccount.id, idResult.data),
                    eq(financialAccount.userId, userId)
                )
            )
            .limit(1)

        if (!before) {
            return null
        }

        const changes: {
            name?: string
            currency?: string
            note?: string | null
        } = {}

        if (data.name !== undefined) {
            changes.name = data.name
        }

        if (data.currency !== undefined) {
            changes.currency = data.currency
        }

        if (data.note !== undefined) {
            changes.note = data.note
        }

        const [after] = await tx
            .update(financialAccount)
            .set(changes)
            .where(
                and(
                    eq(financialAccount.id, idResult.data),
                    eq(financialAccount.userId, userId)
                )
            )
            .returning({
                id: financialAccount.id,
                bankId: financialAccount.bankId,
                name: financialAccount.name,
                customBankName: financialAccount.customBankName,
                accountNumberLast4: financialAccount.accountNumberLast4,
                accountType: financialAccount.accountType,
                currency: financialAccount.currency,
                status: financialAccount.status,
                note: financialAccount.note,
                createdAt: financialAccount.createdAt,
                updatedAt: financialAccount.updatedAt
            })

        if (!after) {
            throw new Error("Financial account update failed")
        }

        await tx.insert(auditLog).values({
            id: uuidv7(),
            userId,
            entityType: "FINANCIAL_ACCOUNT",
            entityId: before.id,
            action: "UPDATE",
            beforeData: {
                name: before.name,
                currency: before.currency,
                note: before.note
            },
            afterData: {
                name: after.name,
                currency: after.currency,
                note: after.note
            }
        })

        return after;

    })

    if(!updatedAccount) {
        return Response.json(
            { error: "Financial account not found" },
            { status: 404 }
        )
    }

    return Response.json(
        {
            message: "Financial account updated",
            data: updatedAccount
        },
        { status: 200 }
    )
}

