import { auth } from "@/lib/auth";
import { headers } from "next/headers"
import { db } from "@/lib/db"
import {
    auditLog,
    balanceHistory,
    financialAccount
} from "@/db/business-schema"
import { createBalanceHistorySchema } from "@/lib/validation"
import { and, eq, desc } from "drizzle-orm"
import { v7 as uuidv7 } from "uuid"
import { z } from "zod"


export const POST = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session) {
        return Response.json(
            { error: "Unauthrized" },
            { status: 401 }
        )
    };

    const userId = session.user.id
    const { id: accountId } = await params

    if (!z.uuid().safeParse(accountId).success) {
        return Response.json(
            { error: "Invalid account ID" },
            { status: 400 }
        )
    };

    let body: unknown
    try {
        body = await req.json()
        console.log(body);


    } catch (error) {
        return Response.json(
            { error: "Invalid Json" },
            { status: 400 }
        )
    };

    const result = createBalanceHistorySchema.safeParse(body)
    console.log(result);


    if (!result.success) {
        return Response.json(
            { error: "Validation faild", detail: result.error.issues },
            { status: 400 }
        )
    };

    const data = result.data
    try {

        const saved = await db.transaction(async (tx) => {
            const [account] = await tx
                .select({
                    id: financialAccount.id
                })
                .from(financialAccount)
                .where(
                    and(
                        eq(financialAccount.id, accountId),
                        eq(financialAccount.userId, userId),
                        eq(financialAccount.status, "ACTIVE"),
                    )
                )
                .limit(1)

            if (!account) {
                throw new Error("ACCOUNT_NOT_FOUND")
            }

            const [exiting] = await tx
                .select()
                .from(balanceHistory)
                .where(
                    and(
                        eq(balanceHistory.financialAccountId, accountId),
                        eq(balanceHistory.balanceDate, data.balanceDate)
                    )
                )
                .limit(1)

            const snapshotId = exiting?.id ?? uuidv7()

            const note =
                data.note === undefined
                    ? exiting?.note ?? null
                    : data.note

            const beforeData = exiting
                ? {
                    balanceDate: exiting.balanceDate,
                    balance: exiting.balance,
                    note: exiting.note
                }
                : null;

            const [snapshot] = await tx
                .insert(balanceHistory)
                .values({
                    id: snapshotId,
                    financialAccountId: accountId,
                    balanceDate: data.balanceDate,
                    balance: data.balance,
                    note
                    // note : data.note
                })
                .onConflictDoUpdate({
                    target: [
                        balanceHistory.financialAccountId,
                        balanceHistory.balanceDate
                    ],
                    set: {
                        balance: data.balance,
                        note,
                        updatedAt: new Date()
                    }
                })
                .returning()

            const action = exiting ? "UPDATE" : "CREATE"

            await tx.insert(auditLog).values({
                id: uuidv7(),
                userId,
                entityType: "BALANCE_HISTORY",
                entityId: snapshot.id,
                action,
                beforeData,
                afterData: {
                    balanceDate: snapshot.balanceDate,
                    balance: snapshot.balance,
                    note: snapshot.note
                }
            });

            return {
                id: snapshot.id,
                financialAccountId: snapshot.financialAccountId,
                balanceDate: snapshot.balanceDate,
                balance: snapshot.balance,
                note: snapshot.note,
                action
            }



        });

        return Response.json(
            { message: " Balance Save", data: saved },
            { status: 200 }
        )



    } catch (error) {
        if (error instanceof Error && error.message === "ACCOUNT_NOT_FOUND") {
            return Response.json(
                { error: "Account not found or inactive" },
                { status: 404 }
            )
        }
        console.error("Failed to save balance history :  ", error);

        return Response.json(
            { errror: " Internal server error" },
            { status: 500 }
        )
    }


}

export const GET = async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session) {
            return Response.json(
                { error: "Unauthorized" },
                { status: 401 },
            )
        }
        const userId = session.user.id

        const { id } = await params
        const parsedId = z.uuid().safeParse(id)

        if(!parsedId.success){
            return Response.json(
                {error: " Invalid account ID"},
                {status: 400}
            )
        }

        const accountId = parsedId.data 
        //console.log(accountId);
        

        const [account] = await db
        .select()
        .from(financialAccount)
        .where(
            and(
                eq(financialAccount.id , accountId),
                eq(financialAccount.userId , userId),
                eq(financialAccount.status , "ACTIVE"),
            )
        )
        .limit(1)

        if(!account){
            return Response.json(
                {error: "Account not found"},
                {status: 404}
            )
        }


        const balances = await db
        .select({
            id: balanceHistory.id,
            financialAccountId: balanceHistory.financialAccountId,
            balanceDate: balanceHistory.balanceDate,
            balance : balanceHistory.balance,
            note: balanceHistory.note , 
            createdAt: balanceHistory.createdAt , 
            updatedAt: balanceHistory.updatedAt
        })
        .from(balanceHistory)
        .where(
            eq(balanceHistory.financialAccountId , accountId)
        )
        .orderBy(desc(balanceHistory.balanceDate))

        return Response.json(
            {data: balances}
        )

    } catch (error) {
        console.error("GET balance history error");
        return Response.json(
            {error: "Intenal server error"} ,
            {status: 500} ,
        )
    }
}