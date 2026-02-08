'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Lock, Unlock, Share2, History, Hash, RefreshCcw } from 'lucide-react';

const SEAHAWKS = { navy: '#002244', green: '#69BE28' };
const PATRIOTS = { blue: '#002244', red: '#C60C30' };

function SquaresContent() {
  const [activeBoard, setActiveBoard] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [score, setScore] = useState({ home: 0, away: 0, q: 1, clock: "15:00", active: false });
  const [history, setHistory] = useState<any[]>([]);
  
  const [boards, setBoards] = useState([
    { name: "Alex & Tyler", squares: {} as Record<number, string>, rowNums: [5,1,2,9,3,6,8,7,0,4], colNums: [6,1,8,2,7,0,9,3,5,4], swapped: true },
    { name: "Mom & Dad $200", squares: {} as Record<number, string>, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9], swapped: false },
    { name: "Mom & Dad Twenty", squares: {} as Record<number, string>, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9], swapped: false },
    { name: "Board 4", squares: {} as Record<number, string>, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9], swapped: false },
    { name: "Board 5", squares: {} as Record<number, string>, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9], swapped: false },
    { name: "Board 6", squares: {} as Record<number, string>, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9], swapped: false },
    { name: "Board 7", squares: {} as Record<number, string>, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9], swapped: false }
  ]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('d');
    if (data) {
      try {
        const decoded = JSON.parse(atob(data));
        setBoards(decoded.b);
        setHistory(decoded.h || []);
      } catch (e) { console.error("Link error"); }
    } else {
      const saved = localStorage.getItem('sb60-safe-v4');
      if (saved) {
        const p = JSON.parse(saved);
        setBoards(p.b);
        setHistory(p.h || []);
      }
    }
    fetchScore();
    const interval = setInterval(fetchScore, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchScore = async () => {
    try {
      const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
      const data = await res.json();
      const sb = data.events.find((e: any) => e.shortName.includes("SEA") || e.shortName.includes("NE"));
      if (sb) {
        setScore({
          home: parseInt(sb.competitions[0].competitors[0].score) || 0,
          away: parseInt(sb.competitions[0].competitors[1].score) || 0,
          q: sb.status.period,
          clock: sb.status.displayClock,
          active: sb.status.type.state === "in"
        });
      }
    } catch (e) { console.log("Manual override"); }
  };

  const save = (newB = boards, newH = history) => {
    setBoards(newB);
    setHistory(newH);
    localStorage.setItem('sb60-safe-v4', JSON.stringify({ b: newB, h: newH }));
  };

  const editAxisNum = (type: 'row' | 'col', index: number) => {
    if (!isAdmin) return;
    const val = prompt(`Enter number (0-9) for this ${type}:`);
    if (val !== null && !isNaN(parseInt(val))) {
      const nb = JSON.parse(JSON.stringify(boards));
      if (type === 'row') nb[activeBoard].rowNums[index] = parseInt(val);
      else nb[activeBoard].colNums[index] = parseInt(val);
      save(nb);
    }
  };

  const randomizeNums = () => {
    if (!isAdmin || !confirm("Randomize numbers?")) return;
    const nb = JSON.parse(JSON.stringify(boards));
    const shuffle = () => [0,1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
    nb[activeBoard].rowNums = shuffle();
    nb[activeBoard].colNums = shuffle();
    save(nb);
  };

  const massPopulate = () => {
  if (!isAdmin) return;
  const input = prompt("Paste names separated by commas or newlines (exactly 100 names is best):");
  if (!input) return;

  // Split by comma, newline, or tab and trim whitespace
  const names = input.split(/[,\n\t]/).map(n => n.trim()).filter(n => n !== "");
  
  const nb = JSON.parse(JSON.stringify(boards));
  // Loop through the first 100 names and fill the grid row-by-row
  names.forEach((name, i) => {
    if (i < 100) nb[activeBoard].squares[i] = name;
  });

  save(nb);
  alert(`Populated ${names.length} squares!`);
};

  const editSquare = (idx: number) => {
    if (!isAdmin) return;
    const name = prompt("Enter Name:");
    if (name !== null) {
      const nb = JSON.parse(JSON.stringify(boards));
      if (name === "") delete nb[activeBoard].squares[idx];
      else nb[activeBoard].squares[idx] = name;
      save(nb);
    }
  };

  const toggleTeamSwap = () => {
    if (!isAdmin) return;
    const nb = JSON.parse(JSON.stringify(boards));
    nb[activeBoard].swapped = !nb[activeBoard].swapped;
    save(nb);
  };

  // LOGIC FOR AXIS & WINNING
  const isSwapped = boards[activeBoard].swapped;
  const sideColor = isSwapped ? PATRIOTS.red : SEAHAWKS.green;
  const topColor = isSwapped ? SEAHAWKS.green : PATRIOTS.red;
  const sideLabel = isSwapped ? "PAT" : "SEA";
  const topLabel = isSwapped ? "SEA" : "PAT";

  const rowDigit = (isSwapped ? score.away : score.home) % 10;
  const colDigit = (isSwapped ? score.home : score.away) % 10;

  const winCoords = {
    r: boards[activeBoard].rowNums.indexOf(rowDigit),
    c: boards[activeBoard].colNums.indexOf(colDigit)
  };

  const increments = [2, 3, 6, 7, 8];
  const likelyRows = increments.map(inc => ((isSwapped ? score.away : score.home) + inc) % 10);
  const likelyCols = increments.map(inc => ((isSwapped ? score.home : score.away) + inc) % 10);

  return (
    <div className="max-w-2xl mx-auto p-4 min-h-screen pb-24 bg-[#020617] text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black italic text-[#69BE28]">SUPER BOWL LX</h1>
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">SEA vs PAT</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => {
            const data = btoa(JSON.stringify({ b: boards, h: history }));
            navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?d=${data}`);
            alert("Link copied!");
          }} className="p-3 bg-slate-900 rounded-2xl text-blue-400 border border-white/5"><Share2 size={20}/></button>
          <button onClick={() => {if(prompt("Pass?")==='SB2026') setIsAdmin(!isAdmin)}} className="p-3 bg-slate-900 rounded-2xl border border-white/5">
            {isAdmin ? <Unlock size={20} className="text-[#69BE28]" /> : <Lock size={20} className="text-slate-700" />}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2rem] p-6 border border-white/5 mb-6 shadow-2xl">
        <div className="flex justify-between items-center text-center">
          <div className="flex-1">
            <p className="text-[10px] font-black text-[#69BE28] uppercase mb-1">SEA</p>
            <input type="number" disabled={!isAdmin} className="bg-transparent text-5xl font-black w-full text-center outline-none" value={score.home} onChange={e=>setScore({...score, home: +e.target.value})} />
          </div>
          <div className="px-4">
            <div className={`px-3 py-1 rounded-full text-[10px] font-bold italic mb-1 ${score.active ? 'bg-red-600 animate-pulse' : 'bg-slate-800'}`}>
              {score.active ? 'LIVE' : 'FINAL'}
            </div>
            <p className="text-xl font-black text-blue-500">Q{score.q}</p>
            <p className="text-[10px] font-mono text-slate-500 uppercase">{score.clock}</p>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-[#C60C30] uppercase mb-1">PAT</p>
            <input type="number" disabled={!isAdmin} className="bg-transparent text-5xl font-black w-full text-center outline-none" value={score.away} onChange={e=>setScore({...score, away: +e.target.value})} />
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 mb-4 no-scrollbar pb-1">
        {boards.map((b, i) => (
          <button key={i} onClick={() => setActiveBoard(i)} className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase border whitespace-nowrap transition-all ${activeBoard === i ? 'bg-white text-black border-white' : 'bg-slate-900 text-slate-500 border-white/5'}`}>
            {b.name}
          </button>
        ))}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={randomizeNums} className="py-2 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2">
            <Hash size={14}/> Randomize
          </button>
          <button onClick={toggleTeamSwap} className="py-2 bg-slate-800 text-white border border-white/10 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2">
            <RefreshCcw size={14}/> Swap: {sideLabel} Side
          </button>
          <button 
  onClick={massPopulate} 
  className="py-2 bg-purple-600/10 text-purple-400 border border-purple-600/20 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2"
>
  <History size={14}/> Mass Paste Names
</button>
        </div>
      )}

      {/* Grid Labels */}
      <div className="flex justify-between px-8 mb-1">
        <span className="text-[9px] font-black opacity-40">SIDE: {sideLabel}</span>
        <span className="text-[9px] font-black opacity-40 text-right">TOP: {topLabel}</span>
      </div>

      <div className="grid grid-cols-[30px_repeat(10,1fr)] gap-1 mb-8">
        <div />
        {boards[activeBoard].colNums.map((num, i) => (
          <div key={i} onClick={() => editAxisNum('col', i)} 
               style={{ color: topColor }}
               className={`text-center text-sm font-black p-1 rounded ${isAdmin ? 'bg-white/5 animate-pulse cursor-pointer' : ''}`}>
            {num}
          </div>
        ))}
        {boards[activeBoard].rowNums.map((rowNum, r) => (
          <React.Fragment key={r}>
            <div onClick={() => editAxisNum('row', r)} 
                 style={{ color: sideColor }}
                 className={`flex items-center justify-center text-sm font-black rounded ${isAdmin ? 'bg-white/5 animate-pulse cursor-pointer' : ''}`}>
              {rowNum}
            </div>
            {[0,1,2,3,4,5,6,7,8,9].map((_, c) => {
              const idx = r * 10 + c;
              const isWin = r === winCoords.r && c === winCoords.c;

              const isLikelyRow = likelyRows.includes(boards[activeBoard].rowNums[r]) && c === winCoords.c;
              const isLikelyCol = likelyCols.includes(boards[activeBoard].colNums[c]) && r === winCoords.r;
              const isHeat = isLikelyRow || isLikelyCol;

              return (
                <div key={c} onClick={() => editSquare(idx)} 
                     className={`aspect-square rounded-sm border border-white/5 flex items-center justify-center relative transition-all duration-500
                     ${isWin ? 'bg-[#69BE28] z-20 scale-110 shadow-lg' : isHeat ? 'bg-blue-600/30 animate-pulse' : 'bg-[#0f172a]'}`}>
                  <span className={`text-[7px] font-bold text-center leading-none truncate px-0.5 z-10 ${isWin ? 'text-black' : isHeat ? 'text-blue-200' : 'text-slate-500'}`}>
                    {boards[activeBoard].squares[idx] || ""}
                  </span>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="space-y-2">
        {isAdmin && <button onClick={() => save(boards, [...history, {q: `Q${score.q}`, winner: boards[activeBoard].squares[winCoords.r * 10 + winCoords.c] || "None", score: `${score.home}-${score.away}`}])} className="w-full py-4 bg-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/5">Snapshot Result</button>}
        {[...history].reverse().map((h, i) => (
          <div key={i} className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
            <span className="font-black text-blue-500 text-xs">{h.q}</span>
            <span className="font-bold text-sm">{h.winner}</span>
            <span className="text-[10px] font-mono text-slate-600 font-bold">{h.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><SquaresContent /></Suspense>; }
