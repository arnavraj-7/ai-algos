"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PageHeader,
  VisualizerShell,
  Controls,
  StatCard,
  LogEntry,
} from "@/components/visualizer-layout";

// ─── Types ───────────────────────────────────────────────────────
type Step = {
  queens: number[]; // queens[row] = col, -1 means no queen
  action: string;
  type: "explore" | "solution" | "backtrack" | "info" | "success";
  row: number;
  col: number;
  conflicts?: [number, number][]; // pairs of conflicting positions
};

// ─── Algorithm ───────────────────────────────────────────────────
function solveNQueens(n: number): Step[] {
  const steps: Step[] = [];
  const queens: number[] = new Array(n).fill(-1);
  let solutionFound = false;

  steps.push({
    queens: [...queens],
    action: `Starting N-Queens solver for N=${n}`,
    type: "info",
    row: -1,
    col: -1,
  });

  function isSafe(row: number, col: number): [boolean, [number, number][]] {
    const conflicts: [number, number][] = [];
    for (let r = 0; r < row; r++) {
      if (queens[r] === -1) continue;
      if (queens[r] === col) conflicts.push([r, queens[r]]);
      if (Math.abs(queens[r] - col) === Math.abs(r - row))
        conflicts.push([r, queens[r]]);
    }
    return [conflicts.length === 0, conflicts];
  }

  function backtrack(row: number): boolean {
    if (row === n) {
      solutionFound = true;
      steps.push({
        queens: [...queens],
        action: `All ${n} queens placed successfully!`,
        type: "success",
        row: -1,
        col: -1,
      });
      return true;
    }

    for (let col = 0; col < n; col++) {
      const [safe, conflicts] = isSafe(row, col);

      if (!safe) {
        steps.push({
          queens: [...queens],
          action: `Try row ${row + 1}, col ${col + 1} — CONFLICT with queen at (${conflicts[0][0] + 1}, ${conflicts[0][1] + 1})`,
          type: "backtrack",
          row,
          col,
          conflicts,
        });
        continue;
      }

      queens[row] = col;
      steps.push({
        queens: [...queens],
        action: `Place queen at row ${row + 1}, col ${col + 1} — Safe!`,
        type: "explore",
        row,
        col,
      });

      if (backtrack(row + 1)) return true;

      queens[row] = -1;
      steps.push({
        queens: [...queens],
        action: `Remove queen from row ${row + 1} — backtracking`,
        type: "backtrack",
        row,
        col,
      });
    }

    return false;
  }

  backtrack(0);

  if (!solutionFound) {
    steps.push({
      queens: [...queens],
      action: `No solution exists for N=${n}`,
      type: "info",
      row: -1,
      col: -1,
    });
  }

  return steps;
}

// ─── Component ───────────────────────────────────────────────────
export default function NQueensPage() {
  const [n, setN] = useState(8);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(200);
  const [solved, setSolved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const solve = useCallback(() => {
    const result = solveNQueens(n);
    setSteps(result);
    setCurrentStep(0);
    setSolved(true);
  }, [n]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setSteps([]);
    setCurrentStep(0);
    setSolved(false);
  }, []);

  const play = useCallback(() => {
    if (!solved) solve();
    setIsPlaying(true);
  }, [solved, solve]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, steps.length]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [currentStep]);

  const currentData = steps[currentStep];
  const queens = currentData?.queens ?? new Array(n).fill(-1);
  const highlightRow = currentData?.row ?? -1;
  const highlightCol = currentData?.col ?? -1;
  const conflicts = currentData?.conflicts ?? [];
  const queensPlaced = queens.filter((q) => q !== -1).length;
  const backtracks = steps
    .slice(0, currentStep + 1)
    .filter((s) => s.type === "backtrack").length;

  // Compute attacked cells for visualization
  const attacked = new Set<string>();
  for (let r = 0; r < n; r++) {
    if (queens[r] === -1) continue;
    for (let i = 0; i < n; i++) {
      attacked.add(`${r},${i}`);
      attacked.add(`${i},${queens[r]}`);
      if (r + i < n && queens[r] + i < n) attacked.add(`${r + i},${queens[r] + i}`);
      if (r + i < n && queens[r] - i >= 0) attacked.add(`${r + i},${queens[r] - i}`);
      if (r - i >= 0 && queens[r] + i < n) attacked.add(`${r - i},${queens[r] + i}`);
      if (r - i >= 0 && queens[r] - i >= 0) attacked.add(`${r - i},${queens[r] - i}`);
    }
  }

  const cellSize = n <= 8 ? 56 : n <= 10 ? 44 : 36;

  return (
    <VisualizerShell
      header={
        <PageHeader
          title="N-Queens Solver"
          description="Backtracking with constraint satisfaction"
          icon="♛"
          color="from-blue-400 to-cyan-400"
        />
      }
      visualization={
        <div className="flex flex-col items-center gap-4">
          {currentData && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-sm font-mono px-4 py-2 rounded-lg ${
                currentData.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : currentData.type === "backtrack"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : currentData.type === "explore"
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              {currentData.action}
            </motion.div>
          )}

          {/* Board */}
          <div
            className="rounded-xl overflow-hidden border border-zinc-700 shadow-lg"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${n}, ${cellSize}px)`,
            }}
          >
            {Array.from({ length: n * n }).map((_, idx) => {
              const row = Math.floor(idx / n);
              const col = idx % n;
              const isDark = (row + col) % 2 === 1;
              const hasQueen = queens[row] === col;
              const isConflict = conflicts.some(
                ([cr, cc]) => cr === row && cc === col
              );
              const isHighlight = row === highlightRow && col === highlightCol;
              const isAttacked =
                attacked.has(`${row},${col}`) && !hasQueen;

              return (
                <div
                  key={idx}
                  style={{ width: cellSize, height: cellSize }}
                  className={`flex items-center justify-center relative transition-colors duration-200 ${
                    isHighlight && currentData?.type === "backtrack"
                      ? "bg-red-500/30"
                      : isHighlight
                      ? "bg-blue-500/30"
                      : isConflict
                      ? "bg-red-500/20"
                      : isDark
                      ? "bg-zinc-800"
                      : "bg-zinc-700"
                  }`}
                >
                  {isAttacked && !hasQueen && (
                    <div className="absolute inset-0 bg-red-500/5" />
                  )}
                  <AnimatePresence>
                    {hasQueen && (
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{
                          scale: 1,
                          rotate: 0,
                          color: isConflict ? "#ef4444" : "#818cf8",
                        }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="text-lg md:text-2xl z-10"
                      >
                        ♛
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isHighlight && !hasQueen && currentData?.type === "backtrack" && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      className="text-red-400 text-lg"
                    >
                      ✕
                    </motion.span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      }
      controls={
        <Controls
          isPlaying={isPlaying}
          onPlay={play}
          onPause={() => setIsPlaying(false)}
          onStep={() => {
            if (!solved) solve();
            setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
          }}
          onReset={reset}
          speed={speed}
          onSpeedChange={setSpeed}
          currentStep={currentStep}
          totalSteps={steps.length}
          extraControls={
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-400">N:</label>
              <select
                value={n}
                onChange={(e) => {
                  setN(Number(e.target.value));
                  reset();
                }}
                className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-1.5 text-sm"
              >
                {[4, 5, 6, 7, 8, 10, 12].map((v) => (
                  <option key={v} value={v}>
                    {v} × {v}
                  </option>
                ))}
              </select>
            </div>
          }
        />
      }
      stats={
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">
            Statistics
          </h3>
          <StatCard label="Board Size" value={`${n} × ${n}`} color="text-blue-400" />
          <StatCard label="Queens Placed" value={`${queensPlaced} / ${n}`} />
          <StatCard label="Backtracks" value={backtracks} color="text-red-400" />
          <StatCard label="Total Steps" value={steps.length} />
        </div>
      }
      log={
        <div ref={logRef} className="space-y-0.5">
          {steps.slice(0, currentStep + 1).map((s, i) => (
            <LogEntry
              key={i}
              step={i}
              text={s.action}
              type={s.type}
              active={i === currentStep}
            />
          ))}
          {steps.length === 0 && (
            <p className="text-zinc-600 text-center py-4">
              Press Play to watch backtracking in action
            </p>
          )}
        </div>
      }
    />
  );
}
