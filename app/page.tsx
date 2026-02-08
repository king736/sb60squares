'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Lock, Unlock, Share2, History, Hash } from 'lucide-react';

const SEAHAWKS = { navy: '#002244', green: '#69BE28' };
const PATRIOTS = { blue: '#002244', red: '#C60C30' };

function SquaresContent() {
  const [activeBoard, setActiveBoard] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [score, setScore] = useState({ home: 0, away: 0, q: 1, clock: "15:00", active: false });
  const [history, setHistory] = useState<any[]>([]);
  
  // const [boards, setBoards] = useState(() => {
  //   const names = ["Main Family", "Kids Pot", "High Stakes", "Uncle Bob", "Office Pool", "Second Half", "Final Score"];
  //   return names.map(name => ({
  //     name: name,
  //     squares: {} as Record<number, string>,
  //     rowNums: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  //     colNums: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  //   }));
  // });

  // Keep your custom names, but add these rowNums and colNums lines
const [boards, setBoards] = useState([
  { name: "Alex & Tyler", squares: {}, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9] },
  { name: "Mom & Dad $200", squares: {}, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9] },
  { name: "Mom & Dad Twenty", squares: {}, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9] }
  // ... do this for all 7
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
      const saved = localStorage.getItem('sb60-safe-v3');
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
    localStorage.setItem('sb60-safe-v3', JSON.stringify({ b: newB, h: newH }));
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

  const winCoords = {
    r: boards[activeBoard].rowNums.indexOf(score.home % 10),
    c: boards[activeBoard].colNums.indexOf(score.away % 10)
  };

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
          <button onClick={() => {if(prompt("Pass?")==='2026') setIsAdmin(!isAdmin)}} className="p-3 bg-slate-900 rounded-2xl border border-white/5">
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
        <button onClick={randomizeNums} className="w-full mb-4 py-2 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2">
          <Hash size={14}/> Randomize Numbers
        </button>
      )}

      <div className="grid grid-cols-[30px_repeat(10,1fr)] gap-1 mb-8">
        <div />
        {boards[activeBoard].colNums.map((num, i) => (
          <div key={i} onClick={() => editAxisNum('col', i)} className={`text-center text-sm font-black p-1 rounded ${isAdmin ? 'bg-[#C60C30]/20 text-white animate-pulse cursor-pointer' : 'text-[#C60C30]'}`}>
            {num}
          </div>
        ))}
        {boards[activeBoard].rowNums.map((rowNum, r) => (
          <React.Fragment key={r}>
            <div onClick={() => editAxisNum('row', r)} className={`flex items-center justify-center text-sm font-black rounded ${isAdmin ? 'bg-[#69BE28]/20 text-white animate-pulse cursor-pointer' : 'text-[#69BE28]'}`}>
              {rowNum}
            </div>
            {[0,1,2,3,4,5,6,7,8,9].map((_, c) => {
              const idx = r * 10 + c;
              const isWin = r === winCoords.r && c === winCoords.c;
              return (
                <div key={c} onClick={() => editSquare(idx)} 
                     style={{ backgroundColor: isWin ? '#69BE28' : '#0f172a' }}
                     className={`aspect-square rounded-sm border border-white/5 flex items-center justify-center relative ${isWin ? 'ring-2 ring-white z-10 scale-110 shadow-lg' : ''}`}>
                  <span className={`text-[7px] font-bold text-center leading-none truncate px-0.5 ${isWin ? 'text-black' : 'text-slate-400'}`}>
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
