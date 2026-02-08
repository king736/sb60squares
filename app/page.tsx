'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Trophy, Lock, Unlock, Share2, History, Save, RefreshCw, Layers } from 'lucide-react';

function SquaresContent() {
  const [activeBoard, setActiveBoard] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [score, setScore] = useState({ home: 0, away: 0, q: 1, clock: "15:00", active: false });
  const [history, setHistory] = useState<any[]>([]);
  const [boards, setBoards] = useState([
  { name: "Alex & Tyler", squares: {}, rowNums: [6,1,8,2,7,0,9,3,5,4], colNums: [5,1,2,9,3,6,8,7,0,4] },
  { name: "Mom & Dad $200", squares: {}, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9] },
  { name: "Mom & Dad Twenty", squares: {}, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9] },
  { name: "Board 4", squares: {}, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9] },
  { name: "Board 5", squares: {}, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9] },
  { name: "Board 6", squares: {}, rowNums: [0,1,2,3,4,5,6,7,8,9], colNums: [0,1,2,3,4,5,6,7,8,9] }
]);  
  
  return customNames.map((name) => ({
    name: name,
    squares: {} as Record<number, string>
  }));
});


  useEffect(() => {
    // 1. Load from URL if present
    const params = new URLSearchParams(window.location.search);
    const data = params.get('d');
    if (data) {
      try {
        const decoded = JSON.parse(atob(data));
        setBoards(decoded.b);
        setHistory(decoded.h || []);
      } catch (e) { console.error("Link error"); }
    } else {
      // 2. Otherwise load from LocalStorage
      const saved = localStorage.getItem('sb60-state');
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
    } catch (e) { console.log("Manual scoring enabled."); }
  };

  const saveAndSync = (newB = boards, newH = history) => {
    setBoards(newB);
    setHistory(newH);
    localStorage.setItem('sb60-state', JSON.stringify({ b: newB, h: newH }));
  };

  const editSquare = (idx: number) => {
    if (!isAdmin) return;
    const name = prompt("Name for this square:");
    if (name !== null) {
      const nb = [...boards];
      if (name === "") delete nb[activeBoard].squares[idx];
      else nb[activeBoard].squares[idx] = name;
      saveAndSync(nb);
    }
  };

  const generateShareLink = () => {
    const data = btoa(JSON.stringify({ b: boards, h: history }));
    const url = `${window.location.origin}${window.location.pathname}?d=${data}`;
    navigator.clipboard.writeText(url);
    alert("URL Copied! Send this link to your family so they see your names.");
  };

  const recordQuarter = () => {
    const winIdx = (score.home % 10) * 10 + (score.away % 10);
    const winner = boards[activeBoard].squares[winIdx] || "No One";
    const newH = [...history, { q: score.q > 4 ? "Final" : `Q${score.q}`, score: `${score.home}-${score.away}`, winner }];
    saveAndSync(boards, newH);
  };

  const winIdx = (score.home % 10) * 10 + (score.away % 10);
  const nextPossibilities = [
    `${(score.home+3)%10}-${score.away%10}`, `${score.home%10}-${(score.away+3)%10}`,
    `${(score.home+7)%10}-${score.away%10}`, `${score.home%10}-${(score.away+7)%10}`
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black italic text-seahawks-green leading-tight">SUPER BOWL LX</h1>
          <p className="text-[10px] font-bold tracking-[0.3em] text-slate-500 uppercase">Levi&apos;s Stadium • 2026</p>
        </div>
        <div className="flex gap-2">
           <button onClick={generateShareLink} className="p-3 bg-slate-900 rounded-2xl text-blue-400 border border-white/5"><Share2 size={20}/></button>
           <button onClick={() => {if(prompt("Password?")==='SBKing2026$') setIsAdmin(!isAdmin)}} className="p-3 bg-slate-900 rounded-2xl border border-white/5">
             {isAdmin ? <Unlock size={20} className="text-seahawks-green" /> : <Lock size={20} className="text-slate-700" />}
           </button>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="bg-gradient-to-br from-slate-900 to-black rounded-[2rem] p-6 border border-white/5 shadow-2xl mb-6 relative overflow-hidden">
        <div className="flex justify-between items-center relative z-10">
          <div className="text-center">
            <p className="text-[10px] font-black text-seahawks-green mb-1 uppercase">Seahawks</p>
            <input type="number" disabled={!isAdmin} className="bg-transparent text-5xl font-black w-20 text-center outline-none" value={score.home} onChange={e=>setScore({...score, home: +e.target.value})} />
          </div>
          <div className="text-center">
            <div className={`text-[10px] font-bold px-3 py-1 rounded-full mb-1 ${score.active ? 'bg-red-600 animate-pulse' : 'bg-slate-800'}`}>
              {score.active ? 'LIVE' : 'FINAL'}
            </div>
            <p className="text-xl font-black text-blue-500">Q{score.q}</p>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">{score.clock}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-patriots-red mb-1 uppercase">Patriots</p>
            <input type="number" disabled={!isAdmin} className="bg-transparent text-5xl font-black w-20 text-center outline-none" value={score.away} onChange={e=>setScore({...score, away: +e.target.value})} />
          </div>
        </div>
        {isAdmin && <button onClick={recordQuarter} className="w-full mt-4 py-3 bg-seahawks-green/10 text-seahawks-green border border-seahawks-green/20 rounded-xl font-black text-[10px] uppercase tracking-widest">Snapshot Result</button>}
      </div>

      {/* 7 Board Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 no-scrollbar pb-1">
        {boards.map((b, i) => (
          <button key={i} onClick={() => setActiveBoard(i)} className={`px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase border whitespace-nowrap transition-all ${activeBoard === i ? 'bg-white text-black border-white' : 'bg-slate-900 text-slate-500 border-white/5'}`}>
            {b.name}
          </button>
        ))}
      </div>

      {/* The Matrix */}
      <div className="grid grid-cols-[25px_repeat(10,1fr)] gap-1 mb-8">
        <div />
        {[...Array(10)].map((_, i) => <div key={i} className="text-center text-[10px] font-black text-patriots-red opacity-80">{i}</div>)}
        {[...Array(10)].map((_, r) => (
          <React.Fragment key={r}>
            <div className="flex items-center justify-center text-[10px] font-black text-seahawks-green opacity-80">{r}</div>
            {[...Array(10)].map((_, c) => {
              const idx = r * 10 + c;
              const isWin = idx === winIdx;
              const isNext = nextPossibilities.includes(`${r}-${c}`);
              return (
                <div key={c} onClick={() => editSquare(idx)} 
                     style={{ backgroundColor: isWin ? '#69BE28' : isNext ? '#1e40af' : '#0f172a' }}
                     className={`aspect-square rounded-sm border border-white/5 flex items-center justify-center relative ${isWin ? 'ring-2 ring-white z-10 scale-110 shadow-lg shadow-green-500/50' : isNext ? 'animate-pulse ring-1 ring-blue-400' : ''}`}>
                  <span className={`text-[7px] font-bold text-center leading-[1] truncate px-0.5 ${isWin ? 'text-black' : 'text-slate-400'}`}>{boards[activeBoard].squares[idx] || ""}</span>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2 mb-4"><History size={14}/> Quarter Logs</h2>
        {history.length === 0 && <div className="p-8 text-center text-[10px] font-bold text-slate-700 italic border border-white/5 rounded-[2rem]">History will appear here after snapshots...</div>}
        {history.map((h, i) => (
          <div key={i} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
            <span className="font-black text-blue-500 uppercase text-xs">{h.q}</span>
            <span className="font-bold text-sm">{h.winner}</span>
            <span className="text-[10px] font-mono text-slate-600">{h.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() { return <Suspense><SquaresContent /></Suspense>; }
