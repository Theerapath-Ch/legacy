
"use client";

import { useCallback, useEffect, useState } from "react";
import Logout_btn from "../component/Logout_btn";

type CurrencyTotal = {
    currency: string;
    totalBalance: string;
    accountsWithBalance: number;
    latestBalanceDate: string | null;
};

type DashboardSummary = {
    activeAccounts: number;
    totalByCurrency?: CurrencyTotal[];
    totalsByCurrency?: CurrencyTotal[];
};

function formatMoney(value: string, currency: string) {
    const amount = Number(value);

    if (!Number.isFinite(amount)) return `${value} ${currency}`;

    return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(value: string | null) {
    if (!value) return "ยังไม่มีข้อมูล";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function DashboardPage() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showBalances, setShowBalances] = useState(true);

    const loadSummary = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/dashboard/summary", {
                method: "GET",
                cache: "no-store",
            });

            if (response.status === 401) {
                throw new Error("กรุณาเข้าสู่ระบบอีกครั้ง");
            }

            if (!response.ok) {
                throw new Error("ไม่สามารถโหลดข้อมูล Dashboard ได้");
            }

            const result = await response.json();
            console.log(result);
            
            setSummary(result.data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "เกิดข้อผิดพลาด กรุณาลองใหม่",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    const totals =
        summary?.totalByCurrency ??
        summary?.totalsByCurrency ??
        [];

    const accountsWithBalance = totals.reduce(
        (sum, item) => sum + item.accountsWithBalance,
        0,
    );

    const latestDate = totals
        .map((item) => item.latestBalanceDate)
        .filter((date): date is string => Boolean(date))
        .sort()
        .at(-1) ?? null;

    return (
        <main className="min-h-screen bg-[#F7F8FC] text-slate-800">
            <div className="flex min-h-screen">
                {/* Sidebar */}
                <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white px-5 py-7 lg:flex lg:flex-col">
                    <a href="/dashboard" className="mb-10 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-600 text-lg font-bold text-white">
                            L
                        </span>
                        <span>
                            <span className="block text-lg font-bold tracking-tight">
                                Legacy
                            </span>
                            <span className="text-xs text-slate-400">
                                Your life, organized.
                            </span>
                        </span>
                    </a>

                    <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Workspace
                    </p>

                    <nav className="space-y-1">
                        <a
                            href="/dashboard"
                            aria-current="page"
                            className="flex items-center gap-3 rounded-xl bg-violet-50 px-4 py-3 font-semibold text-violet-700"
                        >
                            <span>◫</span> Overview
                        </a>
                        <a
                            href="/dashboard/accounts"
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-50"
                        >
                            <span>▤</span> My accounts
                        </a>
                        <a
                            href="/dashboard/history"
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-600 transition hover:bg-slate-50"
                        >
                            <span>↗</span> Balance history
                        </a>
                    </nav>

                    <div className="mt-auto rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm font-semibold">Your information matters</p>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                            Keep your financial information up to date so it is ready when
                            you need it.
                        </p>
                    </div>
                    <div>
                        <Logout_btn />
                    </div>
                </aside>

                {/* Main content */}
                <section className="min-w-0 flex-1">
                    <header className="flex items-center justify-between border-b border-slate-200/80 bg-white px-5 py-4 sm:px-8 lg:px-10">
                        <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 font-bold text-white lg:hidden">
                                L
                            </span>
                            <div>
                                <p className="text-sm font-semibold">Legacy</p>
                                <p className="text-xs text-slate-500">Personal workspace</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowBalances((value) => !value)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-50"
                            aria-label={showBalances ? "ซ่อนยอดเงิน" : "แสดงยอดเงิน"}
                        >
                            {showBalances ? "◉ ซ่อนยอดเงิน" : "◎ แสดงยอดเงิน"}
                        </button>
                    </header>

                    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
                        {/* Welcome */}
                        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                            <div>
                                <p className="mb-2 text-sm font-medium text-violet-600">
                                    YOUR FINANCIAL OVERVIEW
                                </p>
                                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                    Your wealth, at a glance.
                                </h1>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    ภาพรวมทรัพย์สินของคุณในที่เดียว
                                </p>
                            </div>

                            <a
                                href="/dashboard/accounts"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700"
                            >
                                <span className="text-lg">+</span> เพิ่มบัญชี
                            </a>
                        </div>

                        {/* Error state */}
                        {error && (
                            <div
                                role="alert"
                                className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <p className="text-sm text-red-700">{error}</p>
                                <button
                                    type="button"
                                    onClick={() => void loadSummary()}
                                    className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                                >
                                    ลองอีกครั้ง
                                </button>
                            </div>
                        )}

                        {/* Overview cards */}
                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-sm sm:col-span-2 xl:col-span-1">
                                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-2xl" />
                                <div className="relative">
                                    <p className="text-sm text-slate-300">
                                        ยอดเงินล่าสุด แยกตามสกุลเงิน
                                    </p>
                                    <div className="mt-5 space-y-3">
                                        {loading ? (
                                            <div className="h-8 w-40 animate-pulse rounded-lg bg-white/10" />
                                        ) : totals.length > 0 ? (
                                            totals.map((item) => (
                                                <div key={item.currency}>
                                                    <p className="text-xs text-slate-400">
                                                        {item.currency}
                                                    </p>
                                                    <p className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                                                        {showBalances
                                                            ? formatMoney(item.totalBalance, item.currency)
                                                            : "••••••••"}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-2xl font-semibold">—</p>
                                        )}
                                    </div>
                                    <p className="mt-5 text-xs text-slate-400">
                                        ยอดรวมจาก snapshot ล่าสุดของแต่ละบัญชี
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/30">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">บัญชีที่ใช้งาน</p>
                                        <p className="mt-4 text-3xl font-bold tracking-tight">
                                            {loading ? "—" : summary?.activeAccounts ?? 0}
                                        </p>
                                    </div>
                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                                        ▤
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-slate-500">
                                    บัญชีที่ยังอยู่ในสถานะใช้งาน
                                </p>
                                <a
                                    href="/dashboard/accounts"
                                    className="mt-5 inline-block text-sm font-semibold text-violet-700 hover:text-violet-900"
                                >
                                    ดูบัญชีทั้งหมด →
                                </a>
                            </div>

                            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/30">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">ข้อมูลยอดเงิน</p>
                                        <p className="mt-4 text-3xl font-bold tracking-tight">
                                            {loading
                                                ? "—"
                                                : `${accountsWithBalance} / ${summary?.activeAccounts ?? 0}`}
                                        </p>
                                    </div>
                                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600">
                                        ✓
                                    </span>
                                </div>
                                <p className="mt-3 text-sm text-slate-500">
                                    บัญชีที่มีการบันทึกยอดเงินแล้ว
                                </p>
                                <p className="mt-5 text-xs text-slate-400">
                                    อัปเดตล่าสุด: {loading ? "กำลังโหลด..." : formatDate(latestDate)}
                                </p>
                            </div>
                        </div>

                        {/* Currency breakdown */}
                        <section>
                            <div className="mb-5 flex items-end justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold">สรุปตามสกุลเงิน</h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        ดูยอดล่าสุดของบัญชีแต่ละสกุลเงิน
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => void loadSummary()}
                                    className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-violet-700"
                                >
                                    ↻ รีเฟรช
                                </button>
                            </div>

                            {loading ? (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {[1, 2, 3].map((item) => (
                                        <div
                                            key={item}
                                            className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white"
                                        />
                                    ))}
                                </div>
                            ) : !error && totals.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl text-violet-600">
                                        +
                                    </div>
                                    <h3 className="mt-4 font-semibold">
                                        เริ่มต้นจัดระเบียบทรัพย์สินของคุณ
                                    </h3>
                                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                                        เพิ่มบัญชีธนาคารก่อน แล้วบันทึกยอดเงินล่าสุด
                                        เพื่อให้ Legacy ช่วยรวบรวมภาพรวมทางการเงินของคุณ
                                    </p>
                                    <a
                                        href="/dashboard/accounts"
                                        className="mt-5 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                                    >
                                        เพิ่มบัญชีแรก
                                    </a>
                                </div>
                            ) : !error ? (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {totals.map((item) => (
                                        <article
                                            key={item.currency}
                                            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 transition hover:-translate-y-0.5 hover:shadow-md"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-sm font-bold text-violet-700">
                                                    {item.currency}
                                                </span>
                                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                                    {item.accountsWithBalance} บัญชี
                                                </span>
                                            </div>
                                            <p className="mt-5 text-sm text-slate-500">
                                                ยอดเงินล่าสุด
                                            </p>
                                            <p className="mt-1 break-words text-2xl font-bold tracking-tight">
                                                {showBalances
                                                    ? formatMoney(item.totalBalance, item.currency)
                                                    : "••••••••"}
                                            </p>
                                            <div className="mt-5 border-t border-slate-100 pt-4">
                                                <p className="text-xs text-slate-400">
                                                    วันที่ของยอดเงินล่าสุด
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-slate-600">
                                                    {formatDate(item.latestBalanceDate)}
                                                </p>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : null}
                        </section>

                        <footer className="border-t border-slate-200/80 pt-5 text-xs leading-5 text-slate-400">
                            ยอดเงินแสดงตามข้อมูลที่คุณบันทึกไว้ ไม่ใช่ยอดเงินแบบเรียลไทม์จากธนาคาร
                        </footer>
                    </div>
                </section>
            </div>
        </main>
    );
}