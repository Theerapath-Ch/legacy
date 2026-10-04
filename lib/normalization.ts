export const normalizeAccountNumber = (accountNumber: string): string => {
    return accountNumber
    .trim()
    .replace(/[\s-]/g,"")
}