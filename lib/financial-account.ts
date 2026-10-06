import { encrypt } from "./encryption"

export const prepareAccountNumber = (accountNumber: string)  => {
    const last4 = accountNumber.slice(-4)
    const encrypted = encrypt(accountNumber)
    return {
        accountNumberEncrypted : encrypted,
        accountNumberLast4: last4
    }
}