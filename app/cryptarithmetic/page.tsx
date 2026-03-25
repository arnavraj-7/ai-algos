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
  nodesExplored: number;
};

// ─── Algorithm: SEND + MORE = MONEY ──────────────────────────────
// Letters ordered by column (right to left) for maximum constraint pruning:
//   Col 0: D + E = Y  (+ carry0)
//   Col 1: N + R = E  (+ carry0 → carry1)
//   Col 2: E + O = N  (+ carry1 → carry2)
//   Col 3: S + M = O  (+ carry2 → carry3)
//   Col 4: carry3 = M
const LETTERS_ORDER = ["D", "Y", "N", "R", "E", "O", "S", "M"];
const ALL_LETTERS = ["S", "E", "N", "D", "M", "O", "R", "Y"];
const WORD1 = ["S", "E", "N", "D"];
const WORD2 = ["M", "O", "R", "E"];
const RESULT = ["M", "O", "N", "E", "Y"];

function wordToNumber(word: string[], a: Assignment): number | null {
  let num = 0;
  for (const letter of word) {
    if (a[letter] === null || a[letter] === undefined) return null;
    num = num * 10 + a[letter]!;
  }
  return num;
}

function solveCryptarithmetic(): Step[] {
  const steps: Step[] = [];
  const assignment: Assignment = {};
  for (const l of ALL_LETTERS) assignment[l] = null;
  let explored = 0;

  steps.push({
    assignment: { ...assignment },
    action: "CSP: Solving SEND + MORE = MONEY (column-by-column pruning)",
    type: "info",
    nodesExplored: 0,
  });

  const usedDigits = new Set<number>();

  // Check column constraints as soon as all letters in a column are assigned
  // Returns: true if consistent, false if violated
  function checkColumns(a: Assignment): { ok: boolean; msg: string } {
    // Column 0 (ones): D + E = Y (mod 10), carry0 = floor((D+E)/10)
    if (a["D"] !== null && a["E"] !== null && a["Y"] !== null) {
      const sum0 = a["D"]! + a["E"]!;
      if (sum0 % 10 !== a["Y"]!) {
        return {
          ok: false,
          msg: `Col 1: ${a["D"]} + ${a["E"]} = ${sum0}, last digit ${sum0 % 10} ≠ Y(${a["Y"]})`,
        };
      }
      const carry0 = Math.floor(sum0 / 10);

      // Column 1 (tens): N + R + carry0 = E (mod 10)
      if (a["N"] !== null && a["R"] !== null) {
        const sum1 = a["N"]! + a["R"]! + carry0;
        if (sum1 % 10 !== a["E"]!) {
          return {
            ok: false,
            msg: `Col 2: ${a["N"]} + ${a["R"]} + carry(${carry0}) = ${sum1}, last digit ${sum1 % 10} ≠ E(${a["E"]})`,
          };
        }
        const carry1 = Math.floor(sum1 / 10);

        // Column 2 (hundreds): E + O + carry1 = N (mod 10)
        if (a["O"] !== null) {
          const sum2 = a["E"]! + a["O"]! + carry1;
          if (sum2 % 10 !== a["N"]!) {
            return {
              ok: false,
              msg: `Col 3: ${a["E"]} + ${a["O"]} + carry(${carry1}) = ${sum2}, last digit ${sum2 % 10} ≠ N(${a["N"]})`,
            };
          }
          const carry2 = Math.floor(sum2 / 10);

          // Column 3 (thousands): S + M + carry2 = O (mod 10)
          if (a["S"] !== null && a["M"] !== null) {
            const sum3 = a["S"]! + a["M"]! + carry2;
            if (sum3 % 10 !== a["O"]!) {
              return {
                ok: false,
                msg: `Col 4: ${a["S"]} + ${a["M"]} + carry(${carry2}) = ${sum3}, last digit ${sum3 % 10} ≠ O(${a["O"]})`,
              };
            }
            const carry3 = Math.floor(sum3 / 10);

            // Column 4 (ten-thousands): carry3 = M
            if (carry3 !== a["M"]!) {
              return {
                ok: false,
                msg: `Col 5: carry(${carry3}) ≠ M(${a["M"]})`,
              };
            }
          }
        }
      }
    }
    return { ok: true, msg: "" };
  }

  function solve(letterIdx: number): boolean {
    if (letterIdx === LETTERS_ORDER.length) {
      // All assigned — verify full solution
      const s = wordToNumber(WORD1, assignment)!;
      const m = wordToNumber(WORD2, assignment)!;
      const r = wordToNumber(RESULT, assignment)!;
      if (s + m === r) {
        steps.push({
          assignment: { ...assignment },
          action: `SOLUTION FOUND: ${s} + ${m} = ${r}`,
          type: "success",
          nodesExplored: explored,
        });
        return true;
      }
      return false;
    }

    const letter = LETTERS_ORDER[letterIdx];
    const startDigit = letter === "S" || letter === "M" ? 1 : 0;

    for (let digit = startDigit; digit <= 9; digit++) {
      if (usedDigits.has(digit)) continue;

      assignment[letter] = digit;
      usedDigits.add(digit);
      explored++;

      steps.push({
        assignment: { ...assignment },
        action: `Assign ${letter} = ${digit}`,
        type: "explore",
        nodesExplored: explored,
      });

      // Check column constraints immediately
      const { ok, msg } = checkColumns(assignment);
      if (!ok) {
        steps.push({
          assignment: { ...assignment },
          action: `Constraint violated: ${msg}`,
          type: "backtrack",
          nodesExplored: explored,
        });
        assignment[letter] = null;
        usedDigits.delete(digit);
        continue;
      }

      if (solve(letterIdx + 1)) return true;

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

// ─── Component ───────────────────────────────────────────────────
export default function CryptarithmeticPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(200);
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
  const assignment =
    currentData?.assignment ??
    Object.fromEntries(ALL_LETTERS.map((l) => [l, null]));
  const backtracks = steps
    .slice(0, currentStep + 1)
    .filter((s) => s.type === "backtrack").length;
  const assigned = Object.values(assignment).filter((v) => v !== null).length;

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
            <div className="flex gap-1.5">{renderWord(WORD1)}</div>
            <div className="flex gap-1.5 items-center">
              <span className="text-2xl font-bold text-zinc-500 mr-2">+</span>
              {renderWord(WORD2)}
            </div>
            <div className="w-full h-px bg-zinc-700 my-1" />
            <div className="flex gap-1.5">{renderWord(RESULT)}</div>
          </div>

          {/* Assignment table */}
          <div className="flex gap-2 flex-wrap justify-center">
            {ALL_LETTERS.map((letter) => (
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
