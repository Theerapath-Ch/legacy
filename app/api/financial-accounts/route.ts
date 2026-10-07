import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { createFinancialAccountSchema } from "@/lib/validation"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { bank, auditLog, financialAccount } from "@/db/business-schema"
import { v7 as uuidv7 } from "uuid";
import { prepareAccountNumber } from "@/lib/financial-account"


export const POST = async (request: Request) => {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) {
        return Response.json(
            { error: "Unauthorized" },
            { status: 401 }
        )
    }

    const userId = session.user.id

    let body: unknown

    try {
        body = await request.json()
    } catch (error) {
        return Response.json(
            { error: "Invalid Json" },
            { status: 400 }
        )
    }

    const result = createFinancialAccountSchema.safeParse(body)

    if (!result.success) {
        return Response.json(
            {
                error: "validation failed ",
                detail: result.error.issues
            },
            { status: 400 }
        )
    }

    const data = result.data

    const bankRecord = await db.select({
        id: bank.id,
        code: bank.code,
        isActive: bank.isActive
    })
        .from(bank)
        .where(eq(bank.id, data.bankId))
        .limit(1)

    if (bankRecord.length === 0) {
        return Response.json(
            { error: "Bank not found" },
            { status: 400 }
        )
    }

    if (!bankRecord[0].isActive) {
        return Response.json(
            { error: "Bank is not active" },
            { status: 400 }
        )
    }

    const selectedBank = bankRecord[0];

    if (selectedBank.code === "OTHER" && !data.customBankName) {
        return Response.json(
            {
                error: "Custom bank name is required for OTHER bank",
            },
            { status: 400 },
        );
    }

    if (selectedBank.code !== "OTHER" && data.customBankName) {
        return Response.json(
            {
                error: "Custom bank name is only allowed for OTHER bank",
            },
            { status: 400 },
        );
    }

    const accountId = uuidv7()

    const prepareAccount = prepareAccountNumber(data.accountNumber)


    await db.transaction(async (tx) => {
        await tx.insert(financialAccount).values({
            id: accountId,
            userId,
            bankId: data.bankId,
            name: data.name,
            customBankName: data.customBankName ?? null,
            accountNumberEncrypted:
                prepareAccount.accountNumberEncrypted,
            accountNumberLast4:
                prepareAccount.accountNumberLast4,
            accountType: data.accountType,
            currency: data.currency,
            note: data.note ?? null,
        });

        await tx.insert(auditLog).values({
            id: uuidv7(),
            userId,
            entityType: "FINANCIAL_ACCOUNT",
            entityId: accountId,
            action: "CREATE",
            beforeData: null,
            afterData: {
                id: accountId,
                bankId: data.bankId,
                name: data.name,
                customBankName: data.customBankName ?? null,
                accountNumberLast4:
                    prepareAccount.accountNumberLast4,
                accountType: data.accountType,
                currency: data.currency,
                note: data.note ?? null,
                status: "ACTIVE",
            },
        });
    });

    return Response.json(
        {
            message: "Financial account created",
            data: {
                id: accountId,
                bankId: data.bankId,
                name: data.name,
                customBankName: data.customBankName ?? null,
                accountNumberLast4:
                    prepareAccount.accountNumberLast4,
                accountType: data.accountType,
                currency: data.currency,
                note: data.note ?? null,
                status: "ACTIVE",
            },
        },
        { status: 201 },
    );
}


export const GET = async () => {
    const sesstion = await auth.api.getSession({
        headers: await headers(),
    })

    if (!sesstion) {
        return Response.json(
            { error: "Unauthorized" },
            { status: 401 }
        )
    }

    const userId = sesstion.user.id

    const accqounts = await db.select({
        id: financialAccount.id,
        bankId: financialAccount.bankId,
        name: financialAccount.name,
        customBankName: financialAccount.customBankName,
        accountNumberLast4: financialAccount.accountNumberLast4,
        accountType: financialAccount.accountType,
        currency: financialAccount.currency,
        note: financialAccount.note,
        status: financialAccount.status,
        createdAt: financialAccount.createdAt,
        updatedAt: financialAccount.updatedAt
    })
        .from(financialAccount)
        .where(eq(financialAccount.userId, userId))

    return Response.json(
        {
            message: "Financial accounts retrieved",
            data: accqounts
        },
        { status: 200 }
    )
}