# AI Puzzle Universe — Viva Questions & Answers

## General AI Concepts

**Q1: What is Artificial Intelligence?**
AI is the study of creating systems that can perform tasks that typically require human intelligence — reasoning, learning, problem-solving, perception, and decision-making.

**Q2: What is the difference between informed and uninformed search?**
- **Uninformed (blind) search**: No knowledge about how close a state is to the goal. Examples: BFS, DFS, Uniform Cost Search.
- **Informed (heuristic) search**: Uses a heuristic function to estimate distance to goal. Examples: A*, Greedy Best-First Search.

**Q3: What is a heuristic function?**
A function h(n) that estimates the cost from node n to the goal. A good heuristic guides the search toward the goal faster. It must be **admissible** (never overestimates) for A* to find optimal solutions.

---

## 8-Puzzle Solver (A*, BFS, DFS)

**Q4: How does BFS work?**
BFS explores all nodes at the current depth before moving to the next depth level. It uses a **queue (FIFO)**. It guarantees finding the shortest path but uses a lot of memory.

**Q5: How does DFS work?**
DFS explores as deep as possible along one branch before backtracking. It uses a **stack (LIFO)**. It uses less memory than BFS but doesn't guarantee the shortest path.

**Q6: What is A* algorithm?**
A* uses f(n) = g(n) + h(n) where:
- **g(n)** = actual cost from start to current node
- **h(n)** = estimated cost from current node to goal (heuristic)
- **f(n)** = total estimated cost

It expands the node with the lowest f(n) first.

**Q7: What heuristic do you use for the 8-puzzle?**
**Manhattan Distance** — for each tile, sum the horizontal and vertical distance from its current position to its goal position. It is admissible because each tile needs at least that many moves.

**Q8: Why does A* find the optimal solution?**
Because the Manhattan distance heuristic is **admissible** (never overestimates the true cost) and **consistent** (satisfies triangle inequality). This guarantees A* finds the shortest solution.

**Q9: Why does BFS explore more nodes than A*?**
BFS is blind — it explores all nodes at each depth equally. A* uses the heuristic to prioritize nodes that are closer to the goal, so it explores fewer nodes.

**Q10: How do you check if an 8-puzzle is solvable?**
Count the number of **inversions** (pairs of tiles where a higher-numbered tile precedes a lower one). If the count is even, the puzzle is solvable; if odd, it's not.

---

## N-Queens (Backtracking + CSP)

**Q11: What is the N-Queens problem?**
Place N queens on an N×N chessboard so that no two queens threaten each other — no two queens share the same row, column, or diagonal.

**Q12: What is backtracking?**
A systematic trial-and-error approach: place a queen, check constraints, and if a conflict is found, **undo the last placement** and try the next option. It prunes branches of the search tree that can't lead to a solution.

**Q13: How is N-Queens a Constraint Satisfaction Problem (CSP)?**
- **Variables**: Position of queen in each row (one queen per row)
- **Domain**: Column numbers 1 to N
- **Constraints**: No two queens share the same column or diagonal

**Q14: How do you check if a queen placement is safe?**
For a queen at (row, col), check all previously placed queens at (r, c):
- Same column: `col == c`
- Same diagonal: `|row - r| == |col - c|`

**Q15: What is the time complexity of N-Queens backtracking?**
Worst case: O(N!) since at each row we try up to N columns, but pruning via constraint checking significantly reduces the actual search space.

---

## Tic-Tac-Toe (Minimax + Alpha-Beta Pruning)

**Q16: What is the Minimax algorithm?**
A decision-making algorithm for two-player zero-sum games. It assumes:
- **Maximizer** (AI) tries to maximize the score
- **Minimizer** (opponent) tries to minimize the score

It explores the entire game tree and picks the move that leads to the best outcome assuming optimal play from both sides.

**Q17: What are the terminal values in your Minimax?**
- AI wins: **+10 - depth** (prefer faster wins)
- Human wins: **depth - 10** (prefer slower losses)
- Draw: **0**

**Q18: What is Alpha-Beta Pruning?**
An optimization of Minimax that **skips branches** that can't affect the final decision:
- **Alpha (α)**: Best value the maximizer can guarantee (starts at -∞)
- **Beta (β)**: Best value the minimizer can guarantee (starts at +∞)
- **Prune when α ≥ β** — no need to explore further

**Q19: How much does Alpha-Beta reduce the search?**
In the best case, it reduces the search tree from O(b^d) to O(b^(d/2)), effectively doubling the searchable depth. In our Tic-Tac-Toe, it prunes many branches.

**Q20: Why is the AI unbeatable?**
Because Minimax with full-depth search explores **every possible game state**. Tic-Tac-Toe has a small game tree (~255,168 terminal states), so the AI can compute the optimal move perfectly.

---

## Missionaries & Cannibals (BFS)

**Q21: What is the Missionaries and Cannibals problem?**
3 missionaries and 3 cannibals must cross a river using a boat that holds at most 2 people. At no point can cannibals outnumber missionaries on either bank (or the missionaries get eaten).

**Q22: How is this modeled as a state-space search?**
- **State**: (missionaries_left, cannibals_left, boat_position)
- **Initial state**: (3, 3, left)
- **Goal state**: (0, 0, right)
- **Actions**: Move 1-2 people across the river
- **Constraints**: Cannibals ≤ missionaries on each bank (if missionaries > 0)

**Q23: Why use BFS for this problem?**
BFS guarantees finding the **shortest solution** (minimum number of crossings). The state space is small (about 16 valid states), so BFS is efficient here.

**Q24: How many crossings does the optimal solution take?**
The optimal solution requires **11 crossings** (river trips).

**Q25: What makes a state invalid?**
A state is invalid if on either bank, the number of cannibals exceeds the number of missionaries (when missionaries > 0 on that bank).

---

## Cryptarithmetic (CSP + Backtracking)

**Q26: What is a Cryptarithmetic puzzle?**
A mathematical puzzle where letters represent digits and the goal is to find a digit assignment that makes the arithmetic equation valid. Example: SEND + MORE = MONEY.

**Q27: How is this a CSP?**
- **Variables**: Each unique letter (S, E, N, D, M, O, R, Y)
- **Domains**: Digits 0-9
- **Constraints**:
  - All letters map to different digits
  - Leading letters (S, M) cannot be 0
  - SEND + MORE = MONEY must hold arithmetically

**Q28: What is the solution to SEND + MORE = MONEY?**
9567 + 1085 = 10652, where S=9, E=5, N=6, D=7, M=1, O=0, R=8, Y=2.

**Q29: How does backtracking help solve this?**
We assign digits to letters one by one. After each assignment, we check constraints. If a constraint is violated, we **backtrack** (undo the last assignment) and try the next digit. This avoids testing all 10^8 combinations.

**Q30: What is constraint propagation?**
After assigning a value, we can check partial constraints early (e.g., column-by-column arithmetic check) to prune invalid assignments before trying all letters. This significantly reduces the search space.

---

## Architecture & Implementation

**Q31: What tech stack did you use?**
- **Next.js** (React framework) with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- All algorithms implemented in TypeScript — no external AI libraries or API calls

**Q32: How do the visualizations work?**
1. The algorithm runs and records every step (state + action) into an array
2. The UI plays back the steps with configurable speed
3. Each step updates the visual board/scene and the log panel
4. Users can play, pause, step forward, and reset

**Q33: Why implement algorithms client-side?**
The puzzles have small state spaces, so algorithms run instantly in the browser. No server needed — this makes the app fast, deployable as a static site, and demonstrates the algorithms running in real-time.

**Q34: What is the difference between your project and just calling ChatGPT?**
This project implements the **actual AI algorithms from scratch** — BFS queues, DFS recursion, A* priority queues, Minimax game trees, and CSP backtracking. There are zero LLM/API calls. Every decision is made by the algorithm's logic, and every step is visualized.

---

## Comparison Questions

**Q35: Compare BFS vs DFS for 8-puzzle.**
| Feature | BFS | DFS |
|---------|-----|-----|
| Data Structure | Queue | Stack |
| Completeness | Yes | No (infinite paths) |
| Optimality | Yes (shortest path) | No |
| Memory | O(b^d) — high | O(bd) — low |
| Speed on 8-puzzle | Moderate | Fast but may find long paths |

**Q36: Compare Minimax vs Alpha-Beta.**
| Feature | Minimax | Alpha-Beta |
|---------|---------|------------|
| Result | Optimal move | Same optimal move |
| Nodes explored | All | Fewer (pruned) |
| Time complexity | O(b^d) | O(b^(d/2)) best case |
| Correctness | Always correct | Always correct |

**Q37: Compare informed vs uninformed search.**
| Feature | Uninformed | Informed |
|---------|-----------|----------|
| Heuristic | None | Uses h(n) |
| Efficiency | Lower | Higher |
| Examples | BFS, DFS | A*, Greedy BFS |
| Guarantee | BFS is optimal | A* is optimal (admissible h) |
