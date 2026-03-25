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
type Assignment = Record<string, number | null>;
type Step = {
  assignment: Assignment;
  action: string;
  type: "explore" | "solution" | "backtrack" | "info" | "success";
  checking?: string; // which column is being checked
  nodesExplored: number;
};

// ─── Algorithm: SEND + MORE = MONEY ──────────────────────────────
const LETTERS = ["S", "E", "N", "D", "M", "O", "R", "Y"];
const WORD1 = ["S", "E", "N", "D"];
const WORD2 = ["M", "O", "R", "E"];
const RESULT = ["M", "O", "N", "E", "Y"];

function wordToNumber(word: string[], assignment: Assignment): number | null {
  let num = 0;
  for (const letter of word) {
    if (assignment[letter] === null || assignment[letter] === undefined)
      return null;
    num = num * 10 + assignment[letter]!;
  }
  return num;
}

function solveCryptarithmetic(): Step[] {
  const steps: Step[] = [];
  const assignment: Assignment = {};
  for (const l of LETTERS) assignment[l] = null;
  let explored = 0;

  steps.push({
    assignment: { ...assignment },
    action: "CSP: Solving SEND + MORE = MONEY",
    type: "info",
    nodesExplored: 0,
  });

  const usedDigits = new Set<number>();

  function isConsistent(partial: Assignment): boolean {
    // Check column by column from right to left for early pruning
    const a = partial;
    // All assigned values must be unique (enforced by usedDigits)
    // S and M cannot be 0
    if (a["S"] === 0 || a["M"] === 0) return false;
    return true;
  }

  function checkFull(a: Assignment): boolean {
    const s = wordToNumber(WORD1, a);
    const m = wordToNumber(WORD2, a);
    const r = wordToNumber(RESULT, a);
    if (s === null || m === null || r === null) return false;
    return s + m === r;
  }

  function solve(letterIdx: number): boolean {
    if (explored > 10000) return false;

    if (letterIdx === LETTERS.length) {
      explored++;
      if (checkFull(assignment)) {
        const s = wordToNumber(WORD1, assignment)!;
        const m = wordToNumber(WORD2, assignment)!;
        const r = wordToNumber(RESULT, assignment)!;
        steps.push({
          assignment: { ...assignment },
          action: `✓ SOLUTION: ${s} + ${m} = ${r}`,
          type: "success",
          nodesExplored: explored,
        });
        return true;
      }
      steps.push({
        assignment: { ...assignment },
        action: `Constraint check failed — sum doesn't match`,
        type: "backtrack",
        nodesExplored: explored,
      });
      return false;
    }

    const letter = LETTERS[letterIdx];
    const startDigit = letter === "S" || letter === "M" ? 1 : 0;

    for (let digit = startDigit; digit <= 9; digit++) {
      if (usedDigits.has(digit)) continue;

      assignment[letter] = digit;
      usedDigits.add(digit);
      explored++;

      // Log this assignment
      steps.push({
        assignment: { ...assignment },
        action: `Assign ${letter} = ${digit}`,
        type: "explore",
        nodesExplored: explored,
      });

      if (!isConsistent(assignment)) {
        steps.push({
          assignment: { ...assignment },
          action: `${letter} = ${digit} violates constraint (leading zero)`,
          type: "backtrack",
          nodesExplored: explored,
        });
        assignment[letter] = null;
        usedDigits.delete(digit);
        continue;
      }

      // Early column check when enough letters assigned
      if (canCheckPartial(assignment)) {
        const partialOk = checkPartialColumns(assignment, steps, explored);
        if (!partialOk) {
          assignment[letter] = null;
          usedDigits.delete(digit);
          continue;
        }
      }

      if (solve(letterIdx + 1)) return true;

      // Backtrack
      steps.push({
        assignment: { ...assignment },
        action: `Backtrack: undo ${letter} = ${digit}`,
        type: "backtrack",
        nodesExplored: explored,
      });
      assignment[letter] = null;
      usedDigits.delete(digit);
    }

    return false;
  }

  solve(0);
  return steps;
}

function canCheckPartial(a: Assignment): boolean {
  // Check if D, E, Y are assigned (rightmost column)
  return a["D"] !== null && a["E"] !== null && a["Y"] !== null;
}

function checkPartialColumns(
  a: Assignment,
  steps: Step[],
  explored: number
): boolean {
  // Check rightmost column: D + E = Y (mod 10)
  if (a["D"] !== null && a["E"] !== null && a["Y"] !== null) {
    const sum = a["D"]! + a["E"]!;
    if (sum % 10 !== a["Y"]!) {
      steps.push({
        assignment: { ...a },
        action: `Column check: ${a["D"]} + ${a["E"]} = ${sum}, but Y=${a["Y"]} (need ${sum % 10})`,
        type: "backtrack",
        checking: "column-1",
        nodesExplored: explored,
      });
      return false;
    }
  }
  return true;
}

// ─── Component ───────────────────────────────────────────────────
export default function CryptarithmeticPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(100);
  const [solved, setSolved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const solve = useCallback(() => {
    const result = solveCryptarithmetic();
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
  const assignment = currentData?.assignment ?? Object.fromEntries(LETTERS.map((l) => [l, null]));
  const backtracks = steps
    .slice(0, currentStep + 1)
    .filter((s) => s.type === "backtrack").length;
  const assigned = Object.values(assignment).filter((v) => v !== null).length;

  // Build display with substituted digits
  function renderWord(word: string[]) {
    return word.map((letter, i) => (
      <motion.div
        key={`${letter}-${i}`}
        layout
        className={`w-12 h-14 md:w-16 md:h-18 rounded-lg flex flex-col items-center justify-center border ${
          assignment[letter] !== null
            ? "bg-purple-500/15 border-purple-500/30 text-purple-300"
            : "bg-zinc-800 border-zinc-700 text-zinc-400"
        }`}
      >
        <span className="text-[10px] font-mono text-zinc-500">{letter}</span>
        <span className="text-xl font-bold font-mono">
          {assignment[letter] !== null ? assignment[letter] : "?"}
        </span>
      </motion.div>
    ));
  }

  return (
    <VisualizerShell
      header={
        <PageHeader
          title="Cryptarithmetic Solver"
          description="SEND + MORE = MONEY — CSP with Backtracking"
          icon="🔢"
          color=""
        />
      }
      visualization={
        <div className="flex flex-col items-center gap-6">
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
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}
            >
              {currentData.action}
            </motion.div>
          )}

          {/* Equation display */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col items-end gap-3">
            {/* SEND */}
            <div className="flex gap-1.5">{renderWord(WORD1)}</div>
            {/* + MORE */}
            <div className="flex gap-1.5 items-center">
              <span className="text-2xl font-bold text-zinc-500 mr-2">+</span>
              {renderWord(WORD2)}
            </div>
            {/* Line */}
            <div className="w-full h-px bg-zinc-700 my-1" />
            {/* MONEY */}
            <div className="flex gap-1.5">{renderWord(RESULT)}</div>
          </div>

          {/* Assignment table */}
          <div className="flex gap-2 flex-wrap justify-center">
            {LETTERS.map((letter) => (
              <div
                key={letter}
                className={`flex flex-col items-center px-3 py-2 rounded-lg border text-sm font-mono ${
                  assignment[letter] !== null
                    ? "bg-purple-500/10 border-purple-500/20 text-purple-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-600"
                }`}
              >
                <span className="text-xs text-zinc-500">{letter}</span>
                <span className="font-bold">
                  {assignment[letter] !== null ? assignment[letter] : "—"}
                </span>
              </div>
            ))}
          </div>

          {/* Verification */}
          {currentData?.type === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4"
            >
              <div className="text-2xl font-mono font-bold text-emerald-400">
                {wordToNumber(WORD1, assignment)} +{" "}
                {wordToNumber(WORD2, assignment)} ={" "}
                {wordToNumber(RESULT, assignment)}
              </div>
              <div className="text-xs text-emerald-500/60 mt-1">
                All constraints satisfied!
              </div>
            </motion.div>
          )}
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
          <StatCard label="Algorithm" value="CSP + Backtrack" />
          <StatCard label="Letters Assigned" value={`${assigned} / 8`} />
          <StatCard
            label="Nodes Explored"
            value={currentData?.nodesExplored ?? 0}
          />
          <StatCard label="Backtracks" value={backtracks} />
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
              Press Play to watch CSP solving SEND+MORE=MONEY
            </p>
          )}
        </div>
      }
    />
  );
}

function wordToNumber2(word: string[], assignment: Assignment): number | null {
  return wordToNumber(word, assignment);
}
