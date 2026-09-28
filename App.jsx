import React, { useState } from 'react';
import SimplexCanvas from './SimplexCanvas';
import { KNOWLEDGE_BASE_DIRECTORY, MENU_SECTOR_LIST, HERO_BANNER_CONFIG, TUTORIAL_SLIDER_CONFIG } from './matrixData';

export default function ToyModelUniverse() {
  // --- FLATTENED INTERFACE CONTROL STATES ---
  const [spokenLang, setSpokenLang] = useState("en"); // en = English, it = Italiano
  const [userProfile, setUserProfile] = useState("Physicist"); // Young Learner, Physicist, Mathematician
  const [activeView, setActiveView] = useState("Clifford");     // Clifford, Prime, Simplex, Cube
  const [selectedNode, setSelectedNode] = useState("Sector_EM_Maxwell");
  const [activeSlide, setActiveSlide] = useState(0);

  // Direct, un-nested flat key lookup generation
  const activeRecordKey = `${selectedNode}_${spokenLang}_${userProfile}`;
  const activeNodeData = KNOWLEDGE_BASE_DIRECTORY[activeRecordKey];
  const activeHeroData = HERO_BANNER_CONFIG[spokenLang][userProfile];
  const activeSlideData = TUTORIAL_SLIDER_CONFIG[spokenLang][userProfile][activeSlide];

  const getViewTelemetry = (nodeId) => {
    // Queries the data using the baseline fallback key to update panel menus
    const mockKey = `${nodeId}_en_Physicist`;
    const record = KNOWLEDGE_BASE_DIRECTORY[mockKey];
    if (!record) return "";
    if (activeView === "Clifford") return "Signature: " + record.grade;
    if (activeView === "Prime") return "Multiplicity: [" + record.coordinate + "]";
    if (activeView === "Simplex") return "Simplex Element: " + record.simplex;
    if (activeView === "Cube") return "8-Cube Address: " + record.cube;
    return "";
  };

  const categories = [
    { name: "Foundational Symmetries", color: "#38bdf8", bg: "#0c4a6e30" },
    { name: "Structural Realignments", color: "#34d399", bg: "#064e3b30" },
    { name: "Speculative Frontiers", color: "#f472b6", bg: "#50072530" }
  ];

  const renderSVGChart = () => {
    return (
      <svg viewBox="0 0 500 200" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <line x1="40" y1="20" x2="40" y2="170" stroke="#334155" strokeWidth="1" />
        <line x1="40" y1="170" x2="480" y2="170" stroke="#334155" strokeWidth="1" />
        {[50, 80, 110, 140].map((y, idx) => (
          <line key={idx} x1="40" y1={y} x2="480" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        {Array.from({ length: 9 }).map((_, k) => {
          const x = 40 + (k * 50);
          return (
            <g key={k}>
              <line x1={x} y1="170" x2={x} y2="175" stroke="#334155" strokeWidth="1" />
              <text x={x} y="188" fill="#475569" fontSize="9" fontFamily="monospace" textAnchor="middle">k={k}</text>
            </g>
          );
        })}
        <path d="M 40,165 Q 140,150 240,40 T 440,165" fill="none" stroke="#f472b6" strokeWidth="2.5" />
        <path d="M 40,140 C 140,140 240,120 390,50 T 440,25" fill="none" stroke="#34d399" strokeWidth="2.5" strokeDasharray="2 2" />
        <circle cx="240" cy="40" r="5" fill="#22d3ee" />
        <text x="240" y="28" fill="#22d3ee" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">210 GUT Peak</text>
        <circle cx="390" cy="50" r="4" fill="#fbbf24" />
        <text x="390" y="42" fill="#fbbf24" fontSize="8" fontFamily="monospace" textAnchor="middle">128/192 Boundary</text>
      </svg>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', padding: '24px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      
      {/* LANGUAGE SELECTOR HEADER */}
      <header style={{ borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#22d3ee' }}>A Toy Model of the Universe</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setSpokenLang("en")} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: '700', backgroundColor: spokenLang === "en" ? '#6366f1' : '#1e293b', color: '#fff', border: 'none' }}>English</button>
          <button onClick={() => setSpokenLang("it")} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontWeight: '700', backgroundColor: spokenLang === "it" ? '#6366f1' : '#1e293b', color: '#fff', border: 'none' }}>Italiano</button>
        </div>
      </header>

      {/* HERO INTRO BLOCK */}
      <section style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', border: '1px solid #312e81', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', fontWeight: '800', tracking: '0.1em', color: '#818cf8' }}>{activeHeroData?.hook}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {["Young Learner", "Physicist", "Mathematician"].map(p => (
              <button key={p} onClick={() => setUserProfile(p)} style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: userProfile === p ? '#06b6d4' : '#1e293b', color: userProfile === p ? '#0f172a' : '#94a3b8', border: 'none' }}>{p}</button>
            ))}
          </div>
        </div>
        <h2 style={{ margin: '8px 0 0 0', fontSize: '20px', fontWeight: '800' }}>{activeHeroData?.title}</h2>
        <p style={{ margin: '8px 0 0 0', fontSize: '13px', lineHeight: '1.5', color: '#cbd5e1' }}>{activeHeroData?.intro}</p>
      </section>

      {/* TUTORIAL ROADMAP SLIDER */}
      <div style={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: '#fbbf24', letterSpacing: '0.05em' }}>
            {spokenLang === "en" ? `ONBOARDING USER GUIDE // ${userProfile.toUpperCase()} TRACK` : `GUIDA DI BENVENUTO UTENTE // PERCORSO ${userProfile.toUpperCase()}`}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[0, 1, 2, 3].map((idx) => (
              <button 
                key={idx} 
                onClick={() => setActiveSlide(idx)}
                style={{ width: '24px', height: '6px', borderRadius: '3px', border: 'none', cursor: 'pointer', backgroundColor: activeSlide === idx ? '#fbbf24' : '#1e293b', transition: 'background-color 0.2s' }}
              />
            ))}
          </div>
        </div>
        <h4 style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: '800', color: '#ffffff' }}>
          {activeSlideData?.title}
        </h4>
        <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8', lineHeight: '1.4' }}>
          {activeSlideData?.desc}
        </p>
      </div>

      {/* VIEW LAYER FILTER FLAGS */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {["Clifford", "Prime", "Simplex", "Cube"].map(v => (
          <button key={v} onClick={() => setActiveView(v)} style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', cursor: 'pointer', backgroundColor: activeView === v ? '#4f46e5' : '#1e293b', color: '#fff', border: 'none' }}>{v} View</button>
        ))}
      </div>

      {/* TWO COLUMN MASTER INTEGRATION ARENA */}
      <main style={{ display: 'flex', flex: 1, gap: '24px', flexWrap: 'wrap', alignItems: 'stretch' }}>
        
        {/* LEFT COLUMN: Categorized Submenu Lists */}
        <section style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {categories.map((cat) => (
            <div key={cat.name} style={{ backgroundColor: '#1e293b40', border: '1px solid #1e293b', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: cat.color, backgroundColor: cat.bg, padding: '4px 8px', borderRadius: '6px', width: 'fit-content' }}>
                {cat.name}
              </h2>
              
              {MENU_SECTOR_LIST
                .filter(item => item.category === cat.name)
                .map((item) => {
                  const lookupKey = `${item.id}_${spokenLang}_${userProfile}`;
                  const record = KNOWLEDGE_BASE_DIRECTORY[lookupKey];
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedNode(item.id)}
                      style={{ padding: '10px', borderRadius: '8px', border: '1px solid', borderColor: selectedNode === item.id ? cat.color : '#1e293b', backgroundColor: selectedNode === item.id ? '#1e293b' : '#0f172a60', cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: '#f1f5f9' }}>
                          {record ? record.title : item.id}
                        </span>
                        <span style={{ fontSize: '9px', fontFamily: 'monospace', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#64748b' }}>
                          N_{record?.coordinate || "0"}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0 0', color: '#475569', fontSize: '10px', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {getViewTelemetry(item.id)}
                      </p>
                    </div>
                  );
                })}
            </div>
          ))}
        </section>
        {/* RIGHT COLUMN: The Interactive Content Display Theater */}
        <section style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* HARDWARE ACCELERATED CANVAS */}
          <div style={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <SimplexCanvas activeView={activeView} />
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', fontSize: '10px', fontFamily: 'monospace', color: '#64748b', pointerEvents: 'none' }}>
              Active Lattice Mode: <span style={{ color: '#fbbf24' }}>{activeView} Perspective</span>
            </div>
          </div>

          {/* THE TRANSLATION COMPONENT SCREEN */}
          <article style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#083344', color: '#22d3ee', padding: '4px 10px', borderRadius: '9999px', border: '1px solid #155e75', fontWeight: '800' }}>
                  Linguistic Translation Track: {userProfile} ({spokenLang.toUpperCase()})
                </span>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#475569' }}>Active Filter: {activeView}</span>
              </div>
              
              <h3 style={{ margin: '16px 0 0 0', fontSize: '22px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.02em' }}>
                {activeNodeData ? activeNodeData.title : "Sector Selected"}
              </h3>
              <p style={{ margin: '16px 0 0 0', color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', fontWeight: '400' }}>
                {activeNodeData ? activeNodeData.desc : "Select a sector option to view description details."}
              </p>
            </div>

            {/* LIVE NOETHER METRIC COMPRESSION CHART INLINE */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
              <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '12px', letterSpacing: '0.05em' }}>
                {spokenLang === "en" ? "Live Noether Lattice Strain Profile" : "Profilo di Sforzo del Reticolo di Noether in Tempo Reale"}
              </div>
              <div style={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
                {renderSVGChart()}
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', justifyContent: 'center', fontFamily: 'monospace', fontSize: '9px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '3px', backgroundColor: '#f472b6' }}></div>
                    <span style={{ color: '#94a3b8' }}>{spokenLang === "en" ? "Spatial Compression" : "Compressione Spaziale"}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '3px', borderTop: '3px dashed #34d399' }}></div>
                    <span style={{ color: '#94a3b8' }}>{spokenLang === "en" ? "Temporal Dilation" : "Dilatazione Temporale"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CROSS-TALK SYNCHRONIZATION DATA MONITORS */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #334155', fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>
              <div style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', marginBottom: '6px', letterSpacing: '0.05em' }}>Cross-Talk Multi-View Synchronization Matrix:</div>
              <div style={{ margin: '3px 0' }}>• View 1 (Clifford Grade) : <span style={{ color: '#818cf8' }}>{activeNodeData?.grade || "N/A"}</span></div>
              <div style={{ margin: '3px 0' }}>• View 2 (Prime Directory): <span style={{ color: '#34d399' }}>Real Matrix Node Vector [{activeNodeData?.coordinate || "0"}]</span></div>
              <div style={{ margin: '3px 0' }}>• View 3 (Simplex Facet)  : <span style={{ color: '#fbbf24' }}>{activeNodeData?.simplex || "N/A"}</span></div>
              <div style={{ margin: '3px 0' }}>• View 4 (8-Cube Lattice) : <span style={{ color: '#f472b6' }}>{activeNodeData?.cube || "N/A"}</span></div>
            </div>
          </article>
        </section>
      </main>

      {/* SYSTEM STATUS FOOTER */}
      <footer style={{ marginTop: '24px', borderTop: '1px solid #1e293b', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'monospace', color: '#475569' }}>
        <div>Platform Repository State: <span style={{ color: '#10b981', fontWeight: 'bold' }}>● ALL PILLARS SYSTEMATICALLY LINKED & LOCK-VERIFIED</span></div>
        <div>Modularity Rule Invariant: π ≡ π (mod 4) | Cl(4,4,0) Core Complete</div>
      </footer>

    </div>
  );
}

// --- Insert this functional script inside your ToyModelUniverse component ---
const [chatInput, setChatInput] = useState("");
const [chatLog, setChatLog] = useState([]);
const [agentIsThinking, setAgentIsThinking] = useState(false);

const handleAgentQuerySubmit = async (e) => {
  e.preventDefault();
  if (!chatInput.trim()) return;

  const userEvent = { role: 'user', content: chatInput };
  const updatedLog = [...chatLog, userEvent];
  
  setChatLog(updatedLog);
  setChatInput("");
  setAgentIsThinking(true);

  try {
    // Fire the stream packet directly to our new Vercel Edge API route
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: updatedLog,
        spokenLang: spokenLang, // Passes "en" or "it" dynamically
        userProfile: userProfile // Passes "Young Learner", "Physicist", etc.
      })
    });

    if (!response.ok) throw new Error("Network connection drop");

    // Read the stream chunk-by-chunk and update the interface chat bubbles
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let agentResponseText = "";

    setChatLog([...updatedLog, { role: 'assistant', content: "" }]);

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      agentResponseText += decoder.decode(value, { stream: true });
      setChatLog([...updatedLog, { role: 'assistant', content: agentResponseText }]);
    }
  } catch (error) {
    console.error("Agent matrix connection failure:", error);
  } finally {
    setAgentIsThinking(false);
  }
};

