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
type Board = number[];
type Step = {
  board: Board;
  action: string;
  type: "explore" | "solution" | "backtrack" | "info" | "success";
  nodesExplored: number;
  fCost?: number;
  gCost?: number;
  hCost?: number;
};

// ─── Helpers ─────────────────────────────────────────────────────
const GOAL: Board = [1, 2, 3, 4, 5, 6, 7, 8, 0];

function boardKey(b: Board): string {
  return b.join(",");
}

function isGoal(b: Board): boolean {
  return boardKey(b) === boardKey(GOAL);
}

function getNeighbors(b: Board): { board: Board; move: string }[] {
  const idx = b.indexOf(0);
  const row = Math.floor(idx / 3);
  const col = idx % 3;
  const moves: { dr: number; dc: number; name: string }[] = [
    { dr: -1, dc: 0, name: "Down" },
    { dr: 1, dc: 0, name: "Up" },
    { dr: 0, dc: -1, name: "Right" },
    { dr: 0, dc: 1, name: "Left" },
  ];
  const result: { board: Board; move: string }[] = [];
  for (const { dr, dc, name } of moves) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) {
      const ni = nr * 3 + nc;
      const nb = [...b];
      nb[idx] = nb[ni];
      nb[ni] = 0;
      result.push({ board: nb, move: `Move tile ${nb[idx]} ${name}` });
    }
  }
  return result;
}

function manhattan(b: Board): number {
  let dist = 0;
  for (let i = 0; i < 9; i++) {
    if (b[i] === 0) continue;
    const goalIdx = b[i] - 1;
    dist +=
      Math.abs(Math.floor(i / 3) - Math.floor(goalIdx / 3)) +
      Math.abs((i % 3) - (goalIdx % 3));
  }
  return dist;
}

function isSolvable(b: Board): boolean {
  let inversions = 0;
  for (let i = 0; i < 9; i++) {
    for (let j = i + 1; j < 9; j++) {
      if (b[i] && b[j] && b[i] > b[j]) inversions++;
    }
  }
  return inversions % 2 === 0;
}

function generateSolvable(): Board {
  let board: Board;
  do {
    board = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = board.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [board[i], board[j]] = [board[j], board[i]];
    }
  } while (!isSolvable(board) || isGoal(board));
  return board;
}

// ─── Algorithms ──────────────────────────────────────────────────
function solveBFS(initial: Board): Step[] {
  const steps: Step[] = [];
  const visited = new Set<string>();
  const queue: { board: Board; path: { board: Board; move: string }[] }[] = [
    { board: initial, path: [] },
  ];
  visited.add(boardKey(initial));
  let explored = 0;

  steps.push({
    board: initial,
    action: "BFS: Starting exploration from initial state",
    type: "info",
    nodesExplored: 0,
  });

  while (queue.length > 0 && explored < 100000) {
    const { board, path } = queue.shift()!;
    explored++;

    if (explored <= 20 || explored % 100 === 0) {
      steps.push({
        board,
        action: `Exploring node #${explored} (queue: ${queue.length})`,
        type: "explore",
        nodesExplored: explored,
      });
    }

    if (isGoal(board)) {
      for (const p of path) {
        steps.push({
          board: p.board,
          action: `✓ ${p.move}`,
          type: "solution",
          nodesExplored: explored,
        });
      }
      steps.push({
        board,
        action: `Goal reached! Explored ${explored} nodes, solution length: ${path.length}`,
        type: "success",
        nodesExplored: explored,
      });
      return steps;
    }

    for (const { board: nb, move } of getNeighbors(board)) {
      const key = boardKey(nb);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({
          board: nb,
          path: [...path, { board: nb, move }],
        });
      }
    }
  }

  steps.push({
    board: initial,
    action: `BFS exhausted after ${explored} nodes`,
    type: "info",
    nodesExplored: explored,
  });
  return steps;
}

function solveDFS(initial: Board): Step[] {
  const steps: Step[] = [];
  const visited = new Set<string>();
  let explored = 0;
  const MAX_DEPTH = 25;

  steps.push({
    board: initial,
    action: "DFS: Starting depth-limited search (max depth 25)",
    type: "info",
    nodesExplored: 0,
  });

  function dfs(
    board: Board,
    depth: number,
    path: { board: Board; move: string }[]
  ): boolean {
    if (explored > 100000) return false;
    visited.add(boardKey(board));
    explored++;

    if (explored <= 20 || explored % 100 === 0) {
      steps.push({
        board,
        action: `Depth ${depth} — node #${explored}`,
        type: "explore",
        nodesExplored: explored,
      });
    }

    if (isGoal(board)) {
      for (const p of path) {
        steps.push({
          board: p.board,
          action: `✓ ${p.move}`,
          type: "solution",
          nodesExplored: explored,
        });
      }
      steps.push({
        board,
        action: `Goal reached! Explored ${explored} nodes, solution length: ${path.length}`,
        type: "success",
        nodesExplored: explored,
      });
      return true;
    }

    if (depth >= MAX_DEPTH) {
      steps.push({
        board,
        action: `Max depth ${MAX_DEPTH} reached — backtracking`,
        type: "backtrack",
        nodesExplored: explored,
      });
      return false;
    }

    for (const { board: nb, move } of getNeighbors(board)) {
      if (!visited.has(boardKey(nb))) {
        if (dfs(nb, depth + 1, [...path, { board: nb, move }])) return true;
      }
    }

    return false;
  }

  dfs(initial, 0, []);
  return steps;
}

function solveAStar(initial: Board): Step[] {
  const steps: Step[] = [];
  const visited = new Set<string>();
  const open: {
    board: Board;
    g: number;
    h: number;
    path: { board: Board; move: string }[];
  }[] = [];
  let explored = 0;

  const h0 = manhattan(initial);
  open.push({ board: initial, g: 0, h: h0, path: [] });

  steps.push({
    board: initial,
    action: `A*: h(start) = ${h0} (Manhattan distance)`,
    type: "info",
    nodesExplored: 0,
    fCost: h0,
    gCost: 0,
    hCost: h0,
  });

  while (open.length > 0 && explored < 100000) {
    open.sort((a, b) => a.g + a.h - (b.g + b.h));
    const { board, g, h, path } = open.shift()!;
    const key = boardKey(board);

    if (visited.has(key)) continue;
    visited.add(key);
    explored++;

    steps.push({
      board,
      action: `Exploring node #${explored} — f=${g + h} (g=${g}, h=${h})`,
      type: "explore",
      nodesExplored: explored,
      fCost: g + h,
      gCost: g,
      hCost: h,
    });

    if (isGoal(board)) {
      for (const p of path) {
        steps.push({
          board: p.board,
          action: `✓ ${p.move}`,
          type: "solution",
          nodesExplored: explored,
        });
      }
      steps.push({
        board,
        action: `Goal reached! Explored ${explored} nodes, optimal solution: ${path.length} moves`,
        type: "success",
        nodesExplored: explored,
      });
      return steps;
    }

    for (const { board: nb, move } of getNeighbors(board)) {
      if (!visited.has(boardKey(nb))) {
        open.push({
          board: nb,
          g: g + 1,
          h: manhattan(nb),
          path: [...path, { board: nb, move }],
        });
      }
    }
  }

  return steps;
}

// ─── Component ───────────────────────────────────────────────────
export default function EightPuzzlePage() {
  const [initial, setInitial] = useState<Board>(() => generateSolvable());
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(200);
  const [algorithm, setAlgorithm] = useState<"astar" | "bfs" | "dfs">("astar");
  const [solved, setSolved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const solve = useCallback(() => {
    const solvers = { astar: solveAStar, bfs: solveBFS, dfs: solveDFS };
    const result = solvers[algorithm](initial);
    setSteps(result);
    setCurrentStep(0);
    setSolved(true);
  }, [algorithm, initial]);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setSteps([]);
    setCurrentStep(0);
    setSolved(false);
    setInitial(generateSolvable());
  }, []);

  const step = useCallback(() => {
    if (!solved) solve();
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [solved, solve, steps.length]);

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
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [currentStep]);

  const currentBoard = steps[currentStep]?.board ?? initial;
  const currentStepData = steps[currentStep];

  return (
    <VisualizerShell
      header={
        <PageHeader
          title="8-Puzzle Solver"
          description="Compare A*, BFS, and DFS searching for the solution"
          icon="🧩"
          color=""
        />
      }
      visualization={
        <div className="flex flex-col items-center gap-6">
          {/* Algorithm info */}
          {currentStepData && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-sm font-mono px-4 py-2 rounded-lg ${
                currentStepData.type === "solution"
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : currentStepData.type === "backtrack"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : currentStepData.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              }`}
            >
              {currentStepData.action}
            </motion.div>
          )}

          <div className="flex gap-12 items-start">
            {/* Current State */}
            <div className="flex flex-col items-center gap-3">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Current State
              </span>
              <PuzzleBoard board={currentBoard} />
            </div>

            {/* Goal State */}
            <div className="flex flex-col items-center gap-3">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Goal State
              </span>
              <PuzzleBoard board={GOAL} isGoal />
            </div>
          </div>

          {/* Manhattan distance */}
          <div className="text-sm text-zinc-400 font-mono">
            Manhattan Distance: {manhattan(currentBoard)} | Tiles correct:{" "}
            {currentBoard.filter((v, i) => v === GOAL[i] && v !== 0).length}/8
          </div>
        </div>
      }
      controls={
        <Controls
          isPlaying={isPlaying}
          onPlay={play}
          onPause={() => setIsPlaying(false)}
          onStep={step}
          onReset={reset}
          speed={speed}
          onSpeedChange={setSpeed}
          currentStep={currentStep}
          totalSteps={steps.length}
          extraControls={
            <div className="flex items-center gap-2">
              {(["astar", "bfs", "dfs"] as const).map((algo) => (
                <button
                  key={algo}
                  onClick={() => {
                    setAlgorithm(algo);
                    setSolved(false);
                    setSteps([]);
                    setCurrentStep(0);
                    setIsPlaying(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    algorithm === algo
                      ? "bg-zinc-100 text-zinc-900 border-zinc-100"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border-zinc-700"
                  }`}
                >
                  {algo === "astar" ? "A*" : algo.toUpperCase()}
                </button>
              ))}
            </div>
          }
        />
      }
      stats={
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">
            Statistics
          </h3>
          <StatCard
            label="Algorithm"
            value={algorithm === "astar" ? "A*" : algorithm.toUpperCase()}
            color="text-zinc-100"
          />
          <StatCard
            label="Nodes Explored"
            value={currentStepData?.nodesExplored ?? 0}
          />
          <StatCard
            label="Solution Length"
            value={steps.filter((s) => s.type === "solution").length + " moves"}
          />
          {currentStepData?.fCost !== undefined && (
            <>
              <StatCard label="f(n) = g + h" value={currentStepData.fCost} />
              <StatCard label="g(n) cost" value={currentStepData.gCost ?? 0} />
              <StatCard label="h(n) heuristic" value={currentStepData.hCost ?? 0} />
            </>
          )}
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
              Press Play or Step to start solving
            </p>
          )}
        </div>
      }
    />
  );
}

// ─── Puzzle Board Component ──────────────────────────────────────
function PuzzleBoard({ board, isGoal }: { board: Board; isGoal?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
      {board.map((value, index) => {
        const isCorrect = value !== 0 && value === GOAL[index];
        return (
          <motion.div
            key={`${isGoal ? "g" : "c"}-${value || "empty"}`}
            layout={!isGoal}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`
              w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center
              text-xl md:text-2xl font-bold font-mono
              transition-colors duration-200
              ${
                value === 0
                  ? "bg-zinc-900/50"
                  : isCorrect
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : isGoal
                  ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                  : "bg-zinc-800 text-zinc-200 border border-zinc-700 shadow-lg"
              }
            `}
          >
            {value !== 0 && value}
          </motion.div>
        );
      })}
    </div>
  );
}
