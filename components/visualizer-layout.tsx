"use client";

import Link from "next/link";
import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Link
        href="/"
        className="flex items-center justify-center w-10 h-10 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-200"
      >
        ←
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{title}</h1>
          <p className="text-sm text-zinc-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function VisualizerShell({
  header,
  visualization,
  controls,
  log,
  stats,
}: {
  header: ReactNode;
  visualization: ReactNode;
  controls: ReactNode;
  log: ReactNode;
  stats?: ReactNode;
}) {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {header}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main visualization */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 flex items-center justify-center min-h-[400px]">
              {visualization}
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              {controls}
            </div>
          </div>
          {/* Side panel */}
          <div className="flex flex-col gap-4">
            {stats && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                {stats}
              </div>
            )}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex-1 max-h-[500px] overflow-hidden flex flex-col">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                Algorithm Log
              </h3>
              <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs">
                {log}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export function Controls({
  isPlaying,
  onPlay,
  onPause,
  onStep,
  onReset,
  speed,
  onSpeedChange,
  currentStep,
  totalSteps,
  disabled,
  extraControls,
}: {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  currentStep: number;
  totalSteps: number;
  disabled?: boolean;
  extraControls?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        {isPlaying ? (
          <button
            onClick={onPause}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors border border-zinc-700"
          >
            ⏸ Pause
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={disabled}
            className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-zinc-900 text-sm font-medium transition-colors"
          >
            ▶ Play
          </button>
        )}
        <button
          onClick={onStep}
          disabled={disabled || isPlaying}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-sm font-medium transition-colors border border-zinc-700"
        >
          ⏭ Step
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors border border-zinc-700"
        >
          ↺ Reset
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span>Speed:</span>
        <input
          type="range"
          min={50}
          max={1000}
          step={50}
          value={1050 - speed}
          onChange={(e) => onSpeedChange(1050 - Number(e.target.value))}
          className="w-24 accent-zinc-400"
        />
        <span className="font-mono text-xs w-14">{speed}ms</span>
      </div>

      <div className="ml-auto text-sm text-zinc-500 font-mono">
        Step {currentStep} / {totalSteps}
      </div>

      {extraControls}
    </div>
  );
}

export function StatCard({
  label,
  value,
  color = "text-zinc-100",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-sm font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}

export function LogEntry({
  step,
  text,
  type,
  active,
}: {
  step: number;
  text: string;
  type: "explore" | "solution" | "backtrack" | "info" | "success";
  active?: boolean;
}) {
  const colors = {
    explore: "text-blue-400",
    solution: "text-green-400",
    backtrack: "text-red-400",
    info: "text-zinc-400",
    success: "text-emerald-400",
  };

  return (
    <div
      className={`flex gap-2 py-1 px-2 rounded transition-colors ${
        active ? "bg-zinc-800/80" : ""
      }`}
    >
      <span className="text-zinc-600 w-8 text-right shrink-0">{step}</span>
      <span className={colors[type]}>{text}</span>
    </div>
  );
}
