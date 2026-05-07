export const CURRENCIES = [
    { code: "EGP", label: "Egyptian Pound", symbol: "E£" },
    { code: "USD", label: "US Dollar", symbol: "$" },
    { code: "SAR", label: "Saudi Riyal", symbol: "﷼" },
    { code: "AED", label: "UAE Dirham", symbol: "د.إ" },
];

export function getCurrencySymbol(code?: string): string {
    if (!code) return "$";
    const currency = CURRENCIES.find(c => c.code === code);
    return currency?.symbol ?? "$";
}

export function formatCurrency(amount: number, currencyCode?: string): string {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toFixed(2)}`;
}
