import Link from "next/link";

const puzzles = [
  {
    title: "8-Puzzle Solver",
    description:
      "Slide tiles to reach the goal state. Compare A*, BFS, and DFS with step-by-step visualization.",
    algorithms: ["A*", "BFS", "DFS"],
    href: "/eight-puzzle",
    icon: "🧩",
    unit: "Unit 2",
  },
  {
    title: "N-Queens",
    description:
      "Place N queens on a chessboard so no two attack each other. Watch backtracking solve it step by step.",
    algorithms: ["Backtracking", "CSP"],
    href: "/n-queens",
    icon: "♛",
    unit: "Unit 3",
  },
  {
    title: "Tic-Tac-Toe AI",
    description:
      "Play against an unbeatable AI. See Minimax evaluation scores and Alpha-Beta pruning in real time.",
    algorithms: ["Minimax", "Alpha-Beta"],
    href: "/tic-tac-toe",
    icon: "⭕",
    unit: "Unit 3",
  },
  {
    title: "Missionaries & Cannibals",
    description:
      "Classic river crossing puzzle solved by BFS. Animated characters cross safely with constraint checking.",
    algorithms: ["BFS", "State Space"],
    href: "/missionaries",
    icon: "⛵",
    unit: "Unit 1",
  },
  {
    title: "Cryptarithmetic",
    description:
      "SEND + MORE = MONEY — assign digits to letters satisfying all constraints. CSP with backtracking.",
    algorithms: ["CSP", "Backtracking"],
    href: "/cryptarithmetic",
    icon: "🔢",
    unit: "Unit 3",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center pt-20 pb-16 px-4">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-zinc-800 bg-zinc-900 text-sm text-zinc-400">
            Artificial Intelligence — 21CSC206T
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-zinc-100">
            AI Puzzle Universe
          </h1>
          <p className="mt-5 text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Interactive visualizations of classic AI algorithms. Watch BFS, DFS,
            A*, Minimax, and Backtracking solve puzzles step by step.
          </p>
        </div>
      </section>

      {/* Puzzle Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {puzzles.map((puzzle) => (
            <Link
              key={puzzle.href}
              href={puzzle.href}
              className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors duration-200 hover:border-zinc-600 hover:bg-zinc-800/80"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{puzzle.icon}</span>
                <span className="px-2 py-0.5 rounded text-xs font-mono text-zinc-500 bg-zinc-800 border border-zinc-700">
                  {puzzle.unit}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-zinc-100 mb-1.5">
                {puzzle.title}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4 flex-1">
                {puzzle.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {puzzle.algorithms.map((algo) => (
                  <span
                    key={algo}
                    className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700"
                  >
                    {algo}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-500">
        Made with love by Parth Verma
      </footer>
    </main>
  );
}
