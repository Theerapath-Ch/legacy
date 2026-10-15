import { and, count, desc, eq, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { financialAccount, balanceHistory } from "@/db/business-schema"

export const GET = async() => {
    try {
        const sesstion = await auth.api.getSession({
            headers : await headers()
        })

        if(!sesstion) {
            return Response.json(
                {error: "Unauthorized"},
                {status: 401}
            )
        }

        const userId = sesstion.user.id 
        console.log(userId);
        

        const [accountSummary] = await db
        .select({
            activeAccount: count(),
        })
        .from(financialAccount)
        .where(
            and(
                eq(financialAccount.userId , userId),
                eq(financialAccount.status , "ACTIVE"),
            )
        );

        const latestBalances = db.$with("latest_balances").as(
            db 
            .selectDistinctOn([balanceHistory.financialAccountId], {
                financialAccountId : balanceHistory.financialAccountId,
                currency: financialAccount.currency , 
                balance: balanceHistory.balance , 
                balanceDate: balanceHistory.balanceDate
            })
            .from(balanceHistory)
            .innerJoin(
                financialAccount , 
                eq(
                    balanceHistory.financialAccountId , 
                    financialAccount.id
                )
            )
            .where(
                and(
                    eq(financialAccount.userId , userId),
                    eq(financialAccount.status , "ACTIVE"),
                )
            )
            .orderBy(
                balanceHistory.financialAccountId , 
                desc(balanceHistory.balanceDate)
            )
        ); 


        const totals = await db
        .with(latestBalances)
        .select({
            currency : latestBalances.currency,
            totalBalance: sql<string>`
                COALESCE(SUM(${latestBalances.balance}) , 0)::text
            ` , 
            accountsWithBalance: sql<number>`COUNT(*)::int` ,
            latestBalanceDate: sql<string>`MAX(${latestBalances.balanceDate}):: text`
        })
        .from(latestBalances)
        .groupBy(latestBalances.currency)

        return Response.json({
            data: {
                activeAccounts: accountSummary.activeAccount,
                totalsByCurrency: totals,
            }
        })


    } catch (error) {
        console.error("GET dashboard summary error", error);
        
        return Response.json(
            {error: "Internal server error"} ,
            {status: 500} ,
        )
    }
}