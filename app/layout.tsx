import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Puzzle Universe — Algorithm Visualizer",
  description:
    "Interactive visualizations of classic AI algorithms: A*, BFS, DFS, Minimax, Backtracking, and CSP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#09090b] text-zinc-100 font-sans">
        {children}
      </body>
    </html>
  );
}
