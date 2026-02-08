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
    { name: "Dappers $200", squares: {} as Record<number, string>, rowNums: [9,5,1,3,0,8,4,7,6,2], colNums: [6,2,9,8,4,1,0,3,7,5], swapped: false },
    { name: "Dappers $10", squares: {} as Record<number, string>, rowNums: [9,2,3,6,8,0,7,5,4,1], colNums: [2,7,5,4,8,9,0,3,1,6], swapped: false },
    { name: "Teamz Bar $100", squares: {} as Record<number, string>, rowNums: [1,3,4,2,7,8,5,9,0,6], colNums: [1,9,6,7,2,0,5,4,8,3], swapped: false },
    { name: "Sportsman $10", squares: {} as Record<number, string>, rowNums: [3,8,0,5,6,4,2,7,9,1], colNums: [9,8,2,1,0,5,3,4,7,6], swapped: false },
    { name: "Sportsman 2", squares: {} as Record<number, string>, rowNums: [9,8,6,5,3,2,4,0,1,7], colNums: [3,5,4,0,8,7,1,2,9,6], swapped: false },
    { name: "Sportsman 3", squares: {} as Record<number, string>, rowNums: [1,0,2,8,5,6,7,3,9,4], colNums: [9,0,4,1,6,5,3,8,2,7], swapped: false },
    { name: "Barbershop $20", squares: {} as Record<number, string>, rowNums: [3,2,9,7,6,4,5,8,1,0], colNums: [7,2,5,0,8,6,4,1,3,9], swapped: false }
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
      const saved = localStorage.getItem('sb60-safe-v5');
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
    localStorage.setItem('sb60-safe-v5', JSON.stringify({ b: newB, h: newH }));
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
    const input = prompt("Paste names separated by commas or newlines:");
    if (!input) return;
    const names = input.split(/[,\n\t]/).map(n => n.trim()).filter(n => n !== "");
    const nb = JSON.parse(JSON.stringify(boards));
    names.forEach((name, i) => { if (i < 100) nb[activeBoard].squares[i] = name; });
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
    /*<div className="max-w-2xl mx-auto p-4 min-h-screen pb-24 bg-[#020617] text-white">*/
    <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-screen pb-24 bg-[#020617] text-white">
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
          <button onClick={massPopulate} className="col-span-2 py-2 bg-purple-600/10 text-purple-400 border border-purple-600/20 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2">
            <History size={14}/> Mass Paste Names
          </button>
          <button 
  onClick={() => {
    const data = btoa(JSON.stringify({ b: boards, h: history }));
    const url = `${window.location.origin}${window.location.pathname}?d=${data}`;
    // This opens a QR generator with your link
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`, '_blank');
  }} 
  className="col-span-2 py-2 bg-green-600/10 text-green-400 border border-green-600/20 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2"
>
  <Share2 size={14}/> Generate Guest QR Code
</button>
        </div>
      )}

      {/* Grid Section */}
      <div className="w-full overflow-x-hidden mb-8">
        <div className="flex justify-between mb-1 px-1">
          <span className="text-[8px] font-black opacity-40 tracking-tighter">SIDE: {sideLabel}</span>
          <span className="text-[8px] font-black opacity-40 tracking-tighter text-right">TOP: {topLabel}</span>
        </div>

        <div className="grid grid-cols-[24px_repeat(10,1fr)] gap-0.5 w-full">
          <div />
          {boards[activeBoard].colNums.map((num, i) => (
            <div key={i} onClick={() => editAxisNum('col', i)} 
                 style={{ color: topColor }}
                 className={`text-center text-[10px] sm:text-xs font-black p-0.5 rounded ${isAdmin ? 'bg-white/5 animate-pulse cursor-pointer' : ''}`}>
              {num}
            </div>
          ))}

          {boards[activeBoard].rowNums.map((rowNum, r) => (
            <React.Fragment key={r}>
              <div onClick={() => editAxisNum('row', r)} 
                   style={{ color: sideColor }}
                   className={`flex items-center justify-center text-[10px] sm:text-xs font-black rounded ${isAdmin ? 'bg-white/5 animate-pulse cursor-pointer' : ''}`}>
                {rowNum}
              </div>
              {[0,1,2,3,4,5,6,7,8,9].map((_, c) => {
                const idx = r * 10 + c;
                const isWin = r === winCoords.r && c === winCoords.c;
                const isLikelyRow = likelyRows.includes(boards[activeBoard].rowNums[r]) && c === winCoords.c;
                const isLikelyCol = likelyCols.includes(boards[activeBoard].colNums[c]) && r === winCoords.r;
                const isHeat = isLikelyRow || isLikelyCol;

        //         return (
        //           <div key={c} onClick={() => editSquare(idx)} 
        //                className={`aspect-square rounded-sm border border-white/5 flex items-center justify-center relative overflow-hidden transition-all duration-500
        //                ${isWin ? 'bg-[#69BE28] z-20 ring-1 ring-inset ring-white shadow-lg' : isHeat ? 'bg-blue-600/30 animate-pulse' :
        //                  boards[activeBoard].squares[idx]?.toLowerCase().includes('king') ? 'bg-yellow-500/20 border-yellow-500/50' : // HIGHLIGHT YOUR SQUARES
        //                  'bg-[#0f172a]'}`}>
        //             <span className={`text-[7px] md:text-xs lg:text-sm font-bold text-center leading-tight w-full break-words px-0.5 z-10 
        //               ${isWin ? 'text-black' : 
        // isHeat ? 'text-blue-100' : 
        // boards[activeBoard].squares[idx]?.toLowerCase().includes('king') ? 'text-yellow-400 font-black scale-110' : // TEXT POP
        // 'text-slate-400'}`}>
        //               {boards[activeBoard].squares[idx] || ""}
        //             </span>
        //           </div>
        //         );
              return (
  <div key={c} onClick={() => editSquare(idx)} 
       className={`aspect-square rounded-sm border flex items-center justify-center relative overflow-hidden transition-all duration-500
       ${isWin ? 'z-20 ring-2 ring-white shadow-2xl scale-110' : 'bg-[#0f172a]'}
       ${isHeat && !isWin ? 'bg-blue-600/20 animate-pulse' : ''}
       ${boards[activeBoard].squares[idx]?.toLowerCase().includes('king') && !isWin ? 'border-yellow-500/50' : 'border-white/5'}`}>
    
    {/* The Winner's Circle Background 
    {isWin && (
      <div className="absolute inset-0 bg-[#69BE28] rounded-full scale-90 animate-in zoom-in duration-300" />
    )} */}

    <span className={`text-[7px] md:text-xs lg:text-sm font-bold text-center leading-tight w-full break-words px-0.5 z-10 transition-colors
      ${isWin ? 'text-black' : 
        boards[activeBoard].squares[idx]?.toLowerCase().includes('king') ? 'text-yellow-400 font-black scale-110' : 
        isHeat ? 'text-blue-100' : 
        'text-slate-400'}`}>
      {boards[activeBoard].squares[idx] || ""}
    </span>
  </div>
);
              })}
            </React.Fragment>
          ))}
        </div>
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
