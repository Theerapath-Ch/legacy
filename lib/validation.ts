
import { z } from "zod"
import { normalizeAccountNumber } from "./normalization";


export const SUPPORTED_CURRENCIES = [
    "THB",
    "USD",
] as const;


export const createFinancialAccountSchema = z.object({
    bankId: z.uuid(),

    name: z
        .string()
        .trim()
        .min(1, "Account name is required") // ห้ามเป็นค่าว่าง 
        .max(100, "Account name is too long "),

    accountNumber: z
        .string()
        .trim()
        .min(1) // ห้ามเป็นค่าว่าง 
        .max(50)
        .transform(normalizeAccountNumber)
        .pipe(
            z
                .string()
                .min(1, "Account number is required")
                .regex(/^\d+$/, "Account number must contain digits only"),
        )
    ,


    accountType: z.enum([
        "SAVINGS",
        "CURRENT",
        "FIXED_DEPOSIT",
        "OTHER"
    ]),

    // curency: z
    // .enum(SUPPORTED_CURRENCIES),

    currency: z
        .string()
        .trim()
        .length(3)
        .toUpperCase()
        .pipe(z.enum(SUPPORTED_CURRENCIES)),

    customBankName : z
    .string()
    .trim()
    .max(100, "Custom Bank name is too long")
    .optional(),  

    note: z
        .string()
        .trim()
        .max(500)
        .optional() // optonal คือ ไม่จำเป็นต้องมีมาใน request
})

export type createFinancialAccountInput = z.infer<
    typeof createFinancialAccountSchema
>