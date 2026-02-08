'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Trophy, Lock, Unlock, Share2, History, Save, RefreshCw, Hash } from 'lucide-react';

const SEAHAWKS = { navy: '#002244', green: '#69BE28' };
const PATRIOTS = { blue: '#002244', red: '#C60C30' };

function SquaresContent() {
  const [activeBoard, setActiveBoard] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [score, setScore] = useState({ home: 0, away: 0, q: 1, clock: "15:00", active: false });
  const [history, setHistory] = useState<any[]>([]);
  
 // Keep your custom names, but add these rowNums and colNums lines
const [boards, setBoards] = useState([
  { name: "Alex & Tyler", squares: {}, rowNums: [6,1,8,2,7,0,9,3,5,4], colNums: [5,1,2,9,3,6,8,7,0,4] },
  { name: "Mom & Dad $200", squares: {}, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9] },
  { name: "Mom & Dad Twenty", squares: {}, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9] },
  { name: "Board 4", squares: {}, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9] },
  { name: "Board 5", squares: {}, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9] },
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
      const saved = localStorage.getItem('sb60-state-v2');
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
          home: parseInt(sb.competitions[0].competitors[0].score),
          away: parseInt(sb.competitions[0].competitors[1].score),
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
    localStorage.setItem('sb60-state-v2', JSON.stringify({ b: newB, h: newH }));
  };

  const editAxisNum = (type: 'row' | 'col', index: number) => {
  if (!isAdmin) return;
  const val = prompt(`Enter number for this ${type}:`);
  if (val !== null && !isNaN(parseInt(val))) {
    const nb = [...boards];
    if (type === 'row') nb[activeBoard].rowNums[index] = parseInt(val);
    else nb[activeBoard].colNums[index] = parseInt(val);
    setBoards(nb); 
    // If you have a save() function, call it here
  }
};
  

  const randomizeAllNums = () => {
  if (!isAdmin || !confirm("Randomize numbers for this board?")) return;
  const nb = [...boards];
  nb[activeBoard].rowNums = [...Array(10).keys()].sort(() => Math.random() - 0.5);
  nb[activeBoard].colNums = [...Array(10).keys()].sort(() => Math.random() - 0.5);
  setBoards(nb);
};

  const editSquare = (idx: number) => {
    if (!isAdmin) return;
    const name = prompt("Name:");
    if (name !== null) {
      const nb = [...boards];
      if (name === "") delete nb[activeBoard].squares[idx];
      else nb[activeBoard].squares[idx] = name;
      save(nb);
    }
  };

  // Logic to find the winning square based on CUSTOM numbers
  const getWinCoords = () => {
    const homeDigit = score.home % 10;
    const awayDigit = score.away % 10;
    const r = boards[activeBoard].rowNums.indexOf(homeDigit);
    const c = boards[activeBoard].colNums.indexOf(awayDigit);
    return { r, c };
  };

  const winCoords = getWinCoords();

  return (
    <div className="max-w-2xl mx-auto p-4 min-h-screen pb-20">
      {/* Header & Share (Same as before) */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black italic text-seahawks-green">SUPER BOWL LX</h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">Seahawks vs Patriots</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => {
             const data = btoa(JSON.stringify({ b: boards, h: history }));
             navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?d=${data}`);
             alert("Family Link Copied!");
           }} className="p-3 bg-slate-900 rounded-2xl text-blue-400 border border-white/5"><Share2 size={20}/></button>
           <button onClick={() => {if(prompt("Pass?")==='2026') setIsAdmin(!isAdmin)}} className="p-3 bg-slate-900 rounded-2xl border border-white/5">
             {isAdmin ? <Unlock size={20} className="text-seahawks-green" /> : <Lock size={20} className="text-slate-700" />}
           </button>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="bg-slate-900 rounded-[2rem] p-6 border border-white/5 mb-6">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <p className="text-[10px] font-black text-seahawks-green mb-1 uppercase">SEA</p>
            <input type="number" disabled={!isAdmin} className="bg-transparent text-5xl font-black w-20 text-center outline-none" value={score.home} onChange={e=>setScore({...score, home: +e.target.value})} />
          </div>
          <div className="text-center">
            <div className="px-3 py-1 bg-slate-800 rounded-full text-[10px] font-bold mb-1 italic">Q{score.q}</div>
            <p className="text-[10px] font-mono text-slate-500">{score.clock}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-patriots-red mb-1 uppercase">PAT</p>
            <input type="number" disabled={!isAdmin} className="bg-transparent text-5xl font-black w-20 text-center outline-none" value={score.away} onChange={e=>setScore({...score, away: +e.target.value})} />
          </div>
        </div>
      </div>

      {/* Board Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-4 no-scrollbar">
        {boards.map((b, i) => (
          <button key={i} onClick={() => setActiveBoard(i)} className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase border whitespace-nowrap transition-all ${activeBoard === i ? 'bg-white text-black' : 'bg-slate-900 text-slate-500 border-white/5'}`}>
            {b.name}
          </button>
        ))}
      </div>

      {isAdmin && (
        <button onClick={randomizeAllNums} className="w-full mb-4 py-2 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2">
          <Hash size={12}/> Randomize Grid Numbers
        </button>
      )}

      {/* The Matrix */}
      <div className="grid grid-cols-[25px_repeat(10,1fr)] gap-1 mb-8">
        <div />
        {boards[activeBoard].colNums.map((num, i) => (
          <div key={i} onClick={() => editAxisNum('col', i)} className={`text-center text-xs font-black p-1 rounded ${isAdmin ? 'bg-patriots-red/20 text-white animate-pulse cursor-pointer' : 'text-patriots-red'}`}>
            {num}
          </div>
        ))}
        {boards[activeBoard].rowNums.map((rowNum, r) => (
          <React.Fragment key={r}>
            <div onClick={() => editAxisNum('row', r)} className={`flex items-center justify-center text-xs font-black rounded ${isAdmin ? 'bg-seahawks-green/20 text-white animate-pulse cursor-pointer' : 'text-seahawks-green'}`}>
              {rowNum}
            </div>
            {[...Array(10)].map((_, c) => {
              const idx = r * 10 + c;
              const isWin = r === winCoords.r && c === winCoords.c;
              return (
                <div key={c} onClick={() => editSquare(idx)} 
                     style={{ backgroundColor: isWin ? SEAHAWKS.green : '#0f172a' }}
                     className={`aspect-square rounded-sm border border-white/5 flex items-center justify-center relative ${isWin ? 'ring-2 ring-white z-10 scale-110 shadow-lg shadow-green-500/50' : ''}`}>
                  <span className={`text-[7px] font-bold text-center leading-[1] truncate px-0.5 ${isWin ? 'text-black' : 'text-slate-400'}`}>{boards[activeBoard].squares[idx] || ""}</span>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* History Snapshot */}
      <div className="space-y-2">
        {isAdmin && <button onClick={() => setHistory([...history, {q: `Q${score.q}`, winner: boards[activeBoard].squares[winCoords.r * 10 + winCoords.c] || "None", score: `${score.home}-${score.away}`}])} className="w-full py-3 bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/5">Snapshot Result</button>}
        {history.map((h, i) => (
          <div key={i} className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex justify-between items-center">
            <span className="font-black text-blue-500 text-xs">{h.q}</span>
            <span className="font-bold text-sm">{h.winner}</span>
            <span className="text-[10px] font-mono opacity-50">{h.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><SquaresContent /></Suspense>; }
