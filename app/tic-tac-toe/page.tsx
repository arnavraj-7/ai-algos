"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PageHeader,
  VisualizerShell,
  StatCard,
  LogEntry,
} from "@/components/visualizer-layout";

// ─── Types ───────────────────────────────────────────────────────
type Cell = "X" | "O" | null;
type BoardState = Cell[];
type LogItem = {
  action: string;
  type: "explore" | "solution" | "backtrack" | "info" | "success";
};

type TreeNode = {
  board: BoardState;
  score: number | null;
  move: number;
  children: TreeNode[];
  alpha?: number;
  beta?: number;
  pruned?: boolean;
  isMax: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────
const WINS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board: BoardState): Cell {
  for (const [a, b, c] of WINS) {
    if (board[a] && board[a] === board[b] && board[b] === board[c])
      return board[a];
  }
  return null;
}

function getWinLine(board: BoardState): number[] | null {
  for (const line of WINS) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[b] === board[c])
      return line;
  }
  return null;
}

function isFull(board: BoardState): boolean {
  return board.every((c) => c !== null);
}

// ─── Minimax with Alpha-Beta ─────────────────────────────────────
function minimax(
  board: BoardState,
  isMax: boolean,
  alpha: number,
  beta: number,
  useAlphaBeta: boolean,
  logs: LogItem[],
  stats: { nodesEvaluated: number; pruned: number },
  depth: number,
  parentNode: TreeNode
): number {
  const winner = checkWinner(board);
  if (winner === "O") {
    stats.nodesEvaluated++;
    return 10 - depth;
  }
  if (winner === "X") {
    stats.nodesEvaluated++;
    return depth - 10;
  }
  if (isFull(board)) {
    stats.nodesEvaluated++;
    return 0;
  }

  const moves = board
    .map((c, i) => (c === null ? i : -1))
    .filter((i) => i !== -1);

  if (isMax) {
    let best = -Infinity;
    for (const move of moves) {
      const child: TreeNode = {
        board: [...board],
        score: null,
        move,
        children: [],
        alpha,
        beta,
        isMax: false,
      };
      parentNode.children.push(child);

      const nb = [...board];
      nb[move] = "O";
      child.board = [...nb];

      const score = minimax(nb, false, alpha, beta, useAlphaBeta, logs, stats, depth + 1, child);
      child.score = score;

      stats.nodesEvaluated++;

      if (score > best) best = score;
      if (useAlphaBeta) {
        alpha = Math.max(alpha, best);
        if (beta <= alpha) {
          logs.push({
            action: `α-β prune at depth ${depth}: α=${alpha} ≥ β=${beta}`,
            type: "backtrack",
          });
          stats.pruned++;
          // Mark remaining as pruned
          for (const rm of moves.slice(moves.indexOf(move) + 1)) {
            parentNode.children.push({
              board: [...board],
              score: null,
              move: rm,
              children: [],
              pruned: true,
              isMax: false,
            });
          }
          break;
        }
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const child: TreeNode = {
        board: [...board],
        score: null,
        move,
        children: [],
        alpha,
        beta,
        isMax: true,
      };
      parentNode.children.push(child);

      const nb = [...board];
      nb[move] = "X";
      child.board = [...nb];

      const score = minimax(nb, true, alpha, beta, useAlphaBeta, logs, stats, depth + 1, child);
      child.score = score;

      stats.nodesEvaluated++;

      if (score < best) best = score;
      if (useAlphaBeta) {
        beta = Math.min(beta, best);
        if (beta <= alpha) {
          logs.push({
            action: `α-β prune at depth ${depth}: α=${alpha} ≥ β=${beta}`,
            type: "backtrack",
          });
          stats.pruned++;
          for (const rm of moves.slice(moves.indexOf(move) + 1)) {
            parentNode.children.push({
              board: [...board],
              score: null,
              move: rm,
              children: [],
              pruned: true,
              isMax: true,
            });
          }
          break;
        }
      }
    }
    return best;
  }
}

function getBestMove(
  board: BoardState,
  useAlphaBeta: boolean
): {
  move: number;
  logs: LogItem[];
  stats: { nodesEvaluated: number; pruned: number };
  scores: (number | null)[];
  tree: TreeNode;
} {
  const logs: LogItem[] = [];
  const stats = { nodesEvaluated: 0, pruned: 0 };
  const scores: (number | null)[] = new Array(9).fill(null);
  const tree: TreeNode = {
    board: [...board],
    score: null,
    move: -1,
    children: [],
    isMax: true,
  };

  logs.push({
    action: `AI thinking... evaluating ${board.filter((c) => c === null).length} possible moves`,
    type: "info",
  });

  let bestScore = -Infinity;
  let bestMove = -1;

  const moves = board
    .map((c, i) => (c === null ? i : -1))
    .filter((i) => i !== -1);

  for (const move of moves) {
    const nb = [...board];
    nb[move] = "O";

    const child: TreeNode = {
      board: [...nb],
      score: null,
      move,
      children: [],
      isMax: false,
    };
    tree.children.push(child);

    const score = minimax(nb, false, -Infinity, Infinity, useAlphaBeta, logs, stats, 1, child);
    child.score = score;
    scores[move] = score;

    logs.push({
      action: `Move ${posName(move)}: score = ${score}`,
      type: score >= bestScore ? "explore" : "info",
    });

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  tree.score = bestScore;

  logs.push({
    action: `Best move: ${posName(bestMove)} (score: ${bestScore})`,
    type: "success",
  });

  logs.push({
    action: `Nodes evaluated: ${stats.nodesEvaluated}${
      useAlphaBeta ? `, Pruned: ${stats.pruned} branches` : ""
    }`,
    type: "info",
  });

  return { move: bestMove, logs, stats, scores, tree };
}

function posName(i: number): string {
  const rows = ["top", "mid", "bot"];
  const cols = ["left", "center", "right"];
  return `${rows[Math.floor(i / 3)]}-${cols[i % 3]}`;
}

// ─── Component ───────────────────────────────────────────────────
export default function TicTacToePage() {
  const [board, setBoard] = useState<BoardState>(new Array(9).fill(null));
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [useAlphaBeta, setUseAlphaBeta] = useState(true);
  const [scores, setScores] = useState<(number | null)[]>(
    new Array(9).fill(null)
  );
  const [totalStats, setTotalStats] = useState({ nodesEvaluated: 0, pruned: 0 });
  const [gameTree, setGameTree] = useState<TreeNode | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [showScores, setShowScores] = useState(true);

  const winner = checkWinner(board);
  const winLine = getWinLine(board);
  const full = isFull(board);

  const handleClick = useCallback(
    (index: number) => {
      if (board[index] || winner || full || gameOver) return;

      const newBoard = [...board];
      newBoard[index] = "X";

      const newLogs: LogItem[] = [
        ...logs,
        { action: `You played ${posName(index)}`, type: "info" as const },
      ];

      if (checkWinner(newBoard)) {
        setBoard(newBoard);
        setLogs([...newLogs, { action: "You win! (Impossible against perfect AI)", type: "success" }]);
        setScores(new Array(9).fill(null));
        setGameOver(true);
        return;
      }

      if (isFull(newBoard)) {
        setBoard(newBoard);
        setLogs([...newLogs, { action: "It's a draw!", type: "info" }]);
        setScores(new Array(9).fill(null));
        setGameOver(true);
        return;
      }

      // AI move
      const result = getBestMove(newBoard, useAlphaBeta);
      newBoard[result.move] = "O";

      const allLogs = [...newLogs, ...result.logs];

      setBoard(newBoard);
      setLogs(allLogs);
      setScores(result.scores);
      setGameTree(result.tree);
      setTotalStats((prev) => ({
        nodesEvaluated: prev.nodesEvaluated + result.stats.nodesEvaluated,
        pruned: prev.pruned + result.stats.pruned,
      }));

      if (checkWinner(newBoard)) {
        setLogs([...allLogs, { action: "AI wins!", type: "success" }]);
        setGameOver(true);
      } else if (isFull(newBoard)) {
        setLogs([...allLogs, { action: "It's a draw!", type: "info" }]);
        setGameOver(true);
      }
    },
    [board, logs, winner, full, gameOver, useAlphaBeta]
  );

  const reset = useCallback(() => {
    setBoard(new Array(9).fill(null));
    setLogs([]);
    setScores(new Array(9).fill(null));
    setTotalStats({ nodesEvaluated: 0, pruned: 0 });
    setGameTree(null);
    setGameOver(false);
  }, []);

  return (
    <VisualizerShell
      header={
        <PageHeader
          title="Tic-Tac-Toe AI"
          description="Minimax with Alpha-Beta Pruning — try to beat the unbeatable AI"
          icon="⭕"
          color=""
        />
      }
      visualization={
        <div className="flex flex-col items-center gap-6">
          {/* Status */}
          <div
            className={`text-sm font-mono px-4 py-2 rounded-lg border ${
              winner
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : full
                ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
            }`}
          >
            {winner
              ? `${winner === "X" ? "You" : "AI"} wins!`
              : full
              ? "Draw!"
              : "Your turn (X) — click a cell"}
          </div>

          {/* Board */}
          <div className="grid grid-cols-3 gap-2 p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            {board.map((cell, i) => {
              const isWinCell = winLine?.includes(i);
              return (
                <motion.button
                  key={i}
                  onClick={() => handleClick(i)}
                  whileHover={!cell && !winner ? { scale: 1.05 } : {}}
                  whileTap={!cell && !winner ? { scale: 0.95 } : {}}
                  className={`w-24 h-24 md:w-28 md:h-28 rounded-xl flex flex-col items-center justify-center transition-colors text-4xl font-bold relative ${
                    isWinCell
                      ? "bg-green-500/20 border-2 border-green-500/50"
                      : cell
                      ? "bg-zinc-800 border border-zinc-700"
                      : "bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-700/50 cursor-pointer"
                  }`}
                >
                  <AnimatePresence>
                    {cell && (
                      <motion.span
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className={
                          cell === "X" ? "text-blue-400" : "text-red-400"
                        }
                      >
                        {cell}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {/* Show minimax scores */}
                  {showScores && !cell && scores[i] !== null && (
                    <span
                      className={`absolute bottom-1.5 text-[10px] font-mono ${
                        scores[i]! > 0
                          ? "text-red-400"
                          : scores[i]! < 0
                          ? "text-green-400"
                          : "text-zinc-500"
                      }`}
                    >
                      {scores[i]! > 0
                        ? `+${scores[i]}`
                        : scores[i]}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Mini Game Tree */}
          {gameTree && gameTree.children.length > 0 && (
            <div className="w-full max-w-lg">
              <h4 className="text-xs font-mono text-zinc-500 mb-2 text-center uppercase tracking-wider">
                AI Decision Tree (depth 1)
              </h4>
              <div className="flex gap-1 justify-center flex-wrap">
                {gameTree.children.map((child, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-mono ${
                      child.pruned
                        ? "bg-zinc-800/30 text-zinc-600 line-through"
                        : child.score === gameTree.score
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <span>{posName(child.move)}</span>
                    <span className="font-bold">
                      {child.pruned ? "✂" : child.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      }
      controls={
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
          >
            ↺ New Game
          </button>

          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={useAlphaBeta}
              onChange={(e) => {
                setUseAlphaBeta(e.target.checked);
                reset();
              }}
              className="accent-green-500"
            />
            Alpha-Beta Pruning
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showScores}
              onChange={(e) => setShowScores(e.target.checked)}
              className="accent-green-500"
            />
            Show Scores
          </label>
        </div>
      }
      stats={
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 mb-3">
            Statistics
          </h3>
          <StatCard
            label="Algorithm"
            value={useAlphaBeta ? "Minimax + α-β" : "Minimax"}
            color="text-zinc-100"
          />
          <StatCard label="Nodes Evaluated" value={totalStats.nodesEvaluated} />
          {useAlphaBeta && (
            <StatCard
              label="Branches Pruned"
              value={totalStats.pruned}
              color="text-zinc-100"
            />
          )}
          <StatCard
            label="Game Status"
            value={
              winner ? `${winner === "X" ? "You" : "AI"} Won` : full ? "Draw" : "In Progress"
            }
          />
        </div>
      }
      log={
        <div className="space-y-0.5">
          {logs.map((l, i) => (
            <LogEntry
              key={i}
              step={i}
              text={l.action}
              type={l.type}
              active={i === logs.length - 1}
            />
          ))}
          {logs.length === 0 && (
            <p className="text-zinc-600 text-center py-4">
              Click a cell to make your move
            </p>
          )}
        </div>
      }
    />
  );
}
