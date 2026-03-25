import Link from "next/link";

const puzzles = [
  {
    title: "8-Puzzle Solver",
    description:
      "Slide tiles to reach the goal state. Watch A*, BFS, and DFS race to find the solution with step-by-step visualization.",
    algorithms: ["A*", "BFS", "DFS"],
    href: "/eight-puzzle",
    icon: "🧩",
    color: "from-purple-500 to-violet-600",
    glow: "group-hover:shadow-purple-500/20",
    unit: "Unit 2",
  },
  {
    title: "N-Queens",
    description:
      "Place N queens on a chessboard so no two attack each other. Visualize backtracking solving it step by step.",
    algorithms: ["Backtracking", "CSP"],
    href: "/n-queens",
    icon: "♛",
    color: "from-blue-500 to-cyan-600",
    glow: "group-hover:shadow-blue-500/20",
    unit: "Unit 3",
  },
  {
    title: "Tic-Tac-Toe AI",
    description:
      "Play against an unbeatable AI. See the Minimax game tree and Alpha-Beta pruning cuts in real time.",
    algorithms: ["Minimax", "Alpha-Beta"],
    href: "/tic-tac-toe",
    icon: "⭕",
    color: "from-green-500 to-emerald-600",
    glow: "group-hover:shadow-green-500/20",
    unit: "Unit 3",
  },
  {
    title: "Missionaries & Cannibals",
    description:
      "Classic river crossing puzzle solved by BFS. Watch animated characters cross safely with constraint checking.",
    algorithms: ["BFS", "State Space"],
    href: "/missionaries",
    icon: "⛵",
    color: "from-amber-500 to-orange-600",
    glow: "group-hover:shadow-amber-500/20",
    unit: "Unit 1",
  },
  {
    title: "Cryptarithmetic",
    description:
      "SEND + MORE = MONEY — assign digits to letters satisfying constraints. CSP with backtracking visualized.",
    algorithms: ["CSP", "Backtracking"],
    href: "/cryptarithmetic",
    icon: "🔢",
    color: "from-red-500 to-rose-600",
    glow: "group-hover:shadow-red-500/20",
    unit: "Unit 3",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen grid-bg">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center pt-20 pb-16 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-zinc-800 bg-zinc-900/80 text-sm text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Artificial Intelligence — 21CSC206T
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
              AI Puzzle
            </span>{" "}
            <span className="text-zinc-100">Universe</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Interactive visualizations of classic AI algorithms. Watch BFS, DFS,
            A*, Minimax, and Backtracking solve puzzles step by step — every
            decision, every backtrack, every solution path.
          </p>
        </div>
      </section>

      {/* Puzzle Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {puzzles.map((puzzle) => (
            <Link
              key={puzzle.href}
              href={puzzle.href}
              className={`group relative flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm p-6 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/80 hover:shadow-2xl ${puzzle.glow} hover:-translate-y-1`}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{puzzle.icon}</span>
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {puzzle.unit}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-zinc-100 mb-2">
                {puzzle.title}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed mb-4 flex-1">
                {puzzle.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {puzzle.algorithms.map((algo) => (
                  <span
                    key={algo}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium bg-gradient-to-r ${puzzle.color} text-white/90`}
                  >
                    {algo}
                  </span>
                ))}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-500">
        AI Puzzle Universe — Built for Artificial Intelligence (21CSC206T)
      </footer>
    </main>
  );
}
