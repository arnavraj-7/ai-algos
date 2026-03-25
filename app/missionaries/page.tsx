"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PageHeader,
  VisualizerShell,
  Controls,
  StatCard,
  LogEntry,
} from "@/components/visualizer-layout";

// ─── Types ───────────────────────────────────────────────────────
type State = {
  ml: number; // missionaries on left
  cl: number; // cannibals on left
  boat: "left" | "right";
};
type Step = {
  state: State;
  action: string;
  type: "explore" | "solution" | "backtrack" | "info" | "success";
  nodesExplored: number;
};

// ─── Algorithm ───────────────────────────────────────────────────
function stateKey(s: State): string {
  return `${s.ml},${s.cl},${s.boat}`;
}

function isValid(s: State): boolean {
  const mr = 3 - s.ml;
  const cr = 3 - s.cl;
  if (s.ml < 0 || s.cl < 0 || mr < 0 || cr < 0) return false;
  if (s.ml > 0 && s.cl > s.ml) return false; // cannibals outnumber missionaries left
  if (mr > 0 && cr > mr) return false; // cannibals outnumber missionaries right
  return true;
}

function isGoal(s: State): boolean {
  return s.ml === 0 && s.cl === 0 && s.boat === "right";
}

const MOVES = [
  { m: 1, c: 0, desc: "1 missionary" },
  { m: 2, c: 0, desc: "2 missionaries" },
  { m: 0, c: 1, desc: "1 cannibal" },
  { m: 0, c: 2, desc: "2 cannibals" },
  { m: 1, c: 1, desc: "1 missionary + 1 cannibal" },
];

function solveBFS(): Step[] {
  const steps: Step[] = [];
  const initial: State = { ml: 3, cl: 3, boat: "left" };
  const visited = new Set<string>();
  const queue: { state: State; path: { state: State; action: string }[] }[] = [
    { state: initial, path: [] },
  ];
  visited.add(stateKey(initial));
  let explored = 0;

  steps.push({
    state: initial,
    action: "BFS: All 3 missionaries and 3 cannibals on left bank",
    type: "info",
    nodesExplored: 0,
  });

  while (queue.length > 0) {
    const { state, path } = queue.shift()!;
    explored++;

    if (explored <= 30) {
      const mr = 3 - state.ml;
      const cr = 3 - state.cl;
      steps.push({
        state,
        action: `Exploring: Left(${state.ml}M,${state.cl}C) Right(${mr}M,${cr}C) Boat:${state.boat}`,
        type: "explore",
        nodesExplored: explored,
      });
    }

    if (isGoal(state)) {
      // Add solution path
      for (const p of path) {
        steps.push({
          state: p.state,
          action: `✓ ${p.action}`,
          type: "solution",
          nodesExplored: explored,
        });
      }
      steps.push({
        state,
        action: `Everyone crossed safely! Explored ${explored} states, ${path.length} crossings`,
        type: "success",
        nodesExplored: explored,
      });
      return steps;
    }

    for (const move of MOVES) {
      let ns: State;
      let action: string;
      if (state.boat === "left") {
        ns = {
          ml: state.ml - move.m,
          cl: state.cl - move.c,
          boat: "right",
        };
        action = `→ Send ${move.desc} to right bank`;
      } else {
        ns = {
          ml: state.ml + move.m,
          cl: state.cl + move.c,
          boat: "left",
        };
        action = `← Return ${move.desc} to left bank`;
      }

      if (isValid(ns) && !visited.has(stateKey(ns))) {
        visited.add(stateKey(ns));
        queue.push({
          state: ns,
          path: [...path, { state: ns, action }],
        });
      }
    }
  }

  return steps;
}

// ─── Component ───────────────────────────────────────────────────
export default function MissionariesPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [solved, setSolved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const solve = useCallback(() => {
    const result = solveBFS();
    setSteps(result);
    setCurrentStep(0);
    setSolved(true);
  }, []);

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
  const state = currentData?.state ?? { ml: 3, cl: 3, boat: "left" };
  const mr = 3 - state.ml;
  const cr = 3 - state.cl;
  const solutionSteps = steps.filter((s) => s.type === "solution").length;

  return (
    <VisualizerShell
      header={
        <PageHeader
          title="Missionaries & Cannibals"
          description="BFS state-space search for the classic river crossing puzzle"
          icon="⛵"
          color=""
        />
      }
      visualization={
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
          {/* Status bar */}
          {currentData && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-sm font-mono px-4 py-2 rounded-lg w-full text-center ${
                currentData.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : currentData.type === "solution"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : currentData.type === "backtrack"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              {currentData.action}
            </motion.div>
          )}

          {/* River Scene */}
          <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
            {/* Labels */}
            <div className="flex justify-between px-6 py-2 bg-zinc-900/50 border-b border-zinc-800">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Left Bank
              </span>
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">
                River
              </span>
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Right Bank
              </span>
            </div>

            <div className="flex items-stretch min-h-[200px]">
              {/* Left Bank */}
              <div className="flex-1 p-4 flex flex-col items-center justify-center gap-3 bg-green-500/5">
                <div className="flex gap-2">
                  {Array.from({ length: state.ml }).map((_, i) => (
                    <motion.div
                      key={`ml-${i}`}
                      layout
                      className="flex flex-col items-center"
                    >
                      <span className="text-2xl">🧑‍🦱</span>
                      <span className="text-[9px] font-mono text-blue-400">
                        M
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: state.cl }).map((_, i) => (
                    <motion.div
                      key={`cl-${i}`}
                      layout
                      className="flex flex-col items-center"
                    >
                      <span className="text-2xl">👹</span>
                      <span className="text-[9px] font-mono text-red-400">
                        C
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="text-xs font-mono text-zinc-500 mt-1">
                  {state.ml}M, {state.cl}C
                </div>
              </div>

              {/* River */}
              <div className="w-32 bg-gradient-to-b from-blue-900/20 to-blue-800/20 flex items-center justify-center border-x border-zinc-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-full h-px bg-blue-400/30"
                      style={{ top: `${20 + i * 20}%` }}
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "linear",
                      }}
                    />
                  ))}
                </div>
                <motion.div
                  animate={{ x: state.boat === "left" ? -30 : 30 }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className="text-3xl z-10"
                >
                  ⛵
                </motion.div>
              </div>

              {/* Right Bank */}
              <div className="flex-1 p-4 flex flex-col items-center justify-center gap-3 bg-green-500/5">
                <div className="flex gap-2">
                  {Array.from({ length: mr }).map((_, i) => (
                    <motion.div
                      key={`mr-${i}`}
                      layout
                      className="flex flex-col items-center"
                    >
                      <span className="text-2xl">🧑‍🦱</span>
                      <span className="text-[9px] font-mono text-blue-400">
                        M
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: cr }).map((_, i) => (
                    <motion.div
                      key={`cr-${i}`}
                      layout
                      className="flex flex-col items-center"
                    >
                      <span className="text-2xl">👹</span>
                      <span className="text-[9px] font-mono text-red-400">
                        C
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="text-xs font-mono text-zinc-500 mt-1">
                  {mr}M, {cr}C
                </div>
              </div>
            </div>

            {/* Constraint indicator */}
            <div className="px-6 py-2 bg-zinc-900/50 border-t border-zinc-800 flex justify-center gap-6 text-xs font-mono">
              <span
                className={
                  state.ml > 0 && state.cl > state.ml
                    ? "text-red-400"
                    : "text-green-400"
                }
              >
                Left: {state.ml > 0 && state.cl > state.ml ? "⚠ UNSAFE" : "✓ Safe"}
              </span>
              <span
                className={
                  mr > 0 && cr > mr ? "text-red-400" : "text-green-400"
                }
              >
                Right: {mr > 0 && cr > mr ? "⚠ UNSAFE" : "✓ Safe"}
              </span>
            </div>
          </div>

          {/* Rule reminder */}
          <div className="text-xs text-zinc-600 font-mono text-center">
            Rule: Cannibals must never outnumber missionaries on either bank
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
        />
      }
      stats={
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">
            Statistics
          </h3>
          <StatCard label="Algorithm" value="BFS" />
          <StatCard
            label="States Explored"
            value={currentData?.nodesExplored ?? 0}
          />
          <StatCard label="Solution Crossings" value={solutionSteps} />
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
              Press Play to watch BFS solve the puzzle
            </p>
          )}
        </div>
      }
    />
  );
}
