"use client";

import {
  Bell,
  CalendarDays,
  Check,
  FileBadge,
  Lock,
  ReceiptText,
} from "lucide-react";
import { useEffect, useState } from "react";

const BRANDS = [
  {
    name: "Bimbel Kamu",
    short: "BK",
    domain: "bimbelkamu.com",
    color: "#3b82f6",
    soft: "#93c5fd",
    tagline: "Berani bicara, siap juara",
    kid: "Alya",
  },
  {
    name: "Bimbel Bintang",
    short: "BB",
    domain: "bimbelbintang.id",
    color: "#10b981",
    soft: "#6ee7b7",
    tagline: "Belajar seru, nilai melaju",
    kid: "Raka",
  },
  {
    name: "Harmoni Musik",
    short: "HM",
    domain: "harmonimusik.id",
    color: "#ec4899",
    soft: "#f9a8d4",
    tagline: "Setiap nada punya cerita",
    kid: "Nara",
  },
  {
    name: "Coding Kids",
    short: "CK",
    domain: "codingkids.id",
    color: "#f59e0b",
    soft: "#fcd34d",
    tagline: "Kecil-kecil jago ngoding",
    kid: "Dimas",
  },
];

/** Mockup laptop + HP yang bergantian memakai merek lembaga berbeda */
export function HeroShowcase() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((x) => (x + 1) % BRANDS.length), 3200);
    return () => clearInterval(t);
  }, [paused]);
  const b = BRANDS[i];
  const [first, ...rest] = b.name.split(" ");

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Cahaya warna merek */}
      <div
        aria-hidden
        className="nf-brand nf-glow absolute -inset-10 -z-10 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(closest-side, ${b.color}55, transparent)`,
        }}
      />

      <div className="relative">
        {/* Browser / laptop */}
        <div className="nf-border-glow overflow-hidden rounded-2xl shadow-2xl shadow-black/60">
          <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.03] px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-rose-400/70" />
            <span className="size-2.5 rounded-full bg-amber-300/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
            <div className="mx-auto flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 font-mono text-[11px] text-slate-300 sm:text-xs">
              <Lock className="size-3 text-emerald-300" />
              <span key={b.domain} className="animate-fade-in">
                {b.domain}
              </span>
            </div>
          </div>
          <div className="relative h-[300px] overflow-hidden sm:h-[360px]">
            <div
              className="nf-brand absolute inset-0"
              style={{
                background: `linear-gradient(120deg, #070a18 35%, ${b.color}44 75%, ${b.color}88)`,
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,.15) 1px, transparent 1px)",
                backgroundSize: "18px 18px",
              }}
            />
            <div className="relative flex h-full flex-col p-5 sm:p-7">
              <div className="flex items-center gap-2">
                <span
                  className="nf-brand flex size-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: b.color }}
                >
                  {b.short}
                </span>
                <span className="text-[10px] font-semibold tracking-[0.3em] text-white/90 uppercase">
                  {b.name}
                </span>
              </div>
              <div className="mt-auto grid grid-cols-[1.1fr_1fr] items-end gap-4">
                <div key={b.name} className="animate-fade-in">
                  <span
                    className="nf-brand block h-0.5 w-8"
                    style={{ background: b.soft }}
                  />
                  <p
                    className="nf-brand mt-2 text-xs font-medium sm:text-sm"
                    style={{ color: b.soft }}
                  >
                    {b.tagline}
                  </p>
                  <p className="mt-1 font-condensed text-4xl leading-[0.92] font-semibold text-white uppercase sm:text-5xl">
                    {first}
                    <br />
                    {rest.join(" ")}
                  </p>
                  <span
                    className="nf-brand mt-4 inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold text-white"
                    style={{ background: b.color }}
                  >
                    Daftar siswa →
                  </span>
                </div>
                <div className="hidden grid-cols-3 gap-2 sm:grid">
                  {["Blog", "Mading", "Lokasi"].map((t, k) => (
                    <div
                      key={t}
                      className="nf-brand flex aspect-[3/4.3] flex-col justify-end rounded-xl p-2 ring-1 ring-white/15"
                      style={{
                        background: `linear-gradient(160deg, ${b.color}${["cc", "99", "66"][k]}, #0b1025)`,
                      }}
                    >
                      <span className="text-[9px] font-semibold tracking-wide text-white uppercase">
                        {t}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HP: dashboard orang tua */}
        <div className="nf-float absolute -right-3 -bottom-28 w-[150px] sm:-right-10 sm:-bottom-16 sm:w-[190px] xl:-right-20">
          <div className="rounded-[30px] border border-white/15 bg-[#0a0d1d] p-2 shadow-2xl shadow-black/70">
            <div className="overflow-hidden rounded-[24px] bg-[#0d1226]">
              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                <span
                  className="nf-brand flex size-6 items-center justify-center rounded-full text-[8px] font-bold text-white"
                  style={{ background: b.color }}
                >
                  {b.short}
                </span>
                <span className="flex-1 text-[10px] font-semibold text-white">
                  Dashboard {b.kid}
                </span>
                <Bell className="size-3 text-slate-400" />
              </div>
              <div className="space-y-2 px-3 pb-3">
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-2.5">
                  <svg viewBox="0 0 36 36" className="size-11 -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="rgba(255,255,255,.1)"
                      strokeWidth="4"
                    />
                    <circle
                      className="nf-brand"
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke={b.color}
                      strokeWidth="4"
                      strokeDasharray="88 100"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div>
                    <div className="text-sm font-bold text-white">94%</div>
                    <div className="text-[9px] text-slate-400">Kehadiran</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-2.5">
                  <FileBadge
                    className="nf-brand size-4"
                    style={{ color: b.soft }}
                  />
                  <div className="flex-1 text-[10px] text-slate-300">
                    Rapor Nov
                  </div>
                  <span className="text-sm font-extrabold text-white">A</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-2.5">
                  <ReceiptText className="size-4 text-emerald-300" />
                  <div className="flex-1 text-[10px] text-slate-300">
                    SPP Desember
                  </div>
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-300">
                    <Check className="size-2.5" /> Lunas
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] p-2.5">
                  <CalendarDays className="size-4 text-amber-300" />
                  <div className="flex-1 text-[10px] text-slate-300">
                    Ujian Jumat
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifikasi melayang */}
        <div className="nf-float-delay absolute -top-6 -left-3 hidden items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0d1226]/90 px-3.5 py-2.5 shadow-xl backdrop-blur sm:flex">
          <span className="flex size-8 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
            <Check className="size-4" />
          </span>
          <div>
            <div className="text-xs font-semibold text-white">
              Pembayaran diverifikasi
            </div>
            <div className="text-[10px] text-slate-400">
              SPP {b.kid} · Rp 450.000
            </div>
          </div>
        </div>
      </div>

      {/* Pilih merek */}
      <div className="mt-6 flex flex-wrap items-center justify-start gap-1 pr-40 sm:pr-44 xl:pr-28">
        {BRANDS.map((x, k) => (
          <button
            key={x.name}
            onClick={() => setI(k)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition ${k === i ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"}`}
            aria-label={`Lihat contoh ${x.name}`}
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: x.color }}
            />
            <span className="hidden sm:inline">{x.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
