import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CATEGORIES, MAX_SLOTS_PER_THEME } from './data';
import './App.css';

// Automatically target the local Node backend during development, or the Render backend in production.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function App() {
  const [step, setStep] = useState(1); // 1 = Form, 2 = Puzzle, 3 = Theme, 4 = Success, 5 = Admin
  const [formData, setFormData] = useState({
    team: '', leader: '', phone: '', college: '', email: ''
  });
  const [sessionId, setSessionId] = useState("");
  const [assignedCategory, setAssignedCategory] = useState(null);
  const [puzzleInputs, setPuzzleInputs] = useState(["", "", ""]);
  const [finalTheme, setFinalTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [adminToken, setAdminToken] = useState("");
  const [slotData, setSlotData] = useState({ slots: {}, max: 3 });

  // Timer States
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState(null);

  // Launch Countdown & Admin Override
  const [adminOverride, setAdminOverride] = useState(false);
  const [isGlobalLaunched, setIsGlobalLaunched] = useState(false);
  const [globalLaunchDate, setGlobalLaunchDate] = useState('2026-04-01T00:00:00+05:30');

  const calculateTimeLeft = (targetDate) => {
    const launchDate = new Date(targetDate || '2026-04-01T00:00:00+05:30');
    const difference = launchDate - new Date();
    if (difference <= 0) return null;
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  };
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(globalLaunchDate));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(globalLaunchDate)), 1000);
    return () => clearInterval(timer);
  }, [globalLaunchDate]);

  // Fetch slots immediately so duplicate checks are quick
  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const resp = await axios.get(`${API_URL}/slots`);
      setSlotData(resp.data);
      if (resp.data.isLaunched !== undefined) setIsGlobalLaunched(resp.data.isLaunched);
      if (resp.data.launchDate) setGlobalLaunchDate(resp.data.launchDate);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let animationFrameId;
    if (step === 2 && startTime) {
      const updateTimer = () => {
        setElapsedTime(Date.now() - startTime);
        animationFrameId = requestAnimationFrame(updateTimer);
      };
      animationFrameId = requestAnimationFrame(updateTimer);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [step, startTime]);

  const formatTime = (ms) => {
    if (ms == null) return "N/A";
    const mins = Math.floor(ms / 60000).toString().padStart(2, '0');
    const secs = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    const milli = (ms % 1000).toString().padStart(3, '0');
    return `${mins}:${secs}.${milli}`;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const resp = await axios.post(`${API_URL}/register`, formData);
      
      if (resp.data.kind === "admin") {
         setAdminToken(resp.data.token);
         setStep(5);
         setLoading(false);
         return;
      }
      
      setSessionId(resp.data.id);
      const cat = CATEGORIES.find(c => c.name === resp.data.categoryName);
      setAssignedCategory(cat);
      setStartTime(Date.now());
      setStep(2);
    } catch(err) {
      setErrorMsg(err.response?.data?.error || "Registration failed. Please try again.");
    }
    setLoading(false);
  };

  const checkPuzzles = () => {
    const allCorrect = assignedCategory.puzzles.every((p, i) => 
      (puzzleInputs[i] || "").trim().toUpperCase() === p.answer.toUpperCase()
    );
    if (allCorrect) {
      setFinalTime(elapsedTime);
      setStep(3);
      setErrorMsg('');
    } else {
      setErrorMsg("System access denied. One or more sectors remain encrypted! ⚡");
    }
  };

  const selectTheme = async (themeName) => {
    setLoading(true);
    setErrorMsg('');

    try {
      await axios.post(`${API_URL}/theme`, { 
         id: sessionId, 
         themeName, 
         puzzleAnswer: puzzleInputs.join(", "),
         timeTaken: finalTime
      });
      setFinalTheme(themeName);
      setStep(4);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Theme selection failed.");
      fetchSlots(); // refresh slot data if another team took the last slot
    }
    setLoading(false);
  };

  // --- RENDERING ---

  return (
    <div className="app-container">
      {step === 2 && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '2rem', background: 'rgba(0,0,0,0.8)', padding: '0.8rem 1.5rem', borderRadius: '8px', border: '1px solid var(--primary)', fontSize: '1.5rem', fontFamily: 'monospace', color: 'var(--primary)', zIndex: 1000, boxShadow: '0 0 15px rgba(233, 69, 96, 0.4)' }}>
          ⏱ {formatTime(elapsedTime)}
        </div>
      )}
      <header>
        <h1>🔥 CODE THE COUTURE</h1>
        <p className="subtitle">DECODE • <span onClick={() => setAdminOverride(true)} style={{cursor: "default"}}>DESIGN</span> • DISRUPT</p>
      </header>

      {step === 1 && (
        (timeLeft && !adminOverride && !isGlobalLaunched) ? (
          <div className="card fade-in" style={{ textAlign: "center", padding: "60px 20px" }}>
            <h2 className="glitch" data-text="DECRYPTION OFFLINE" style={{ fontSize: "2.2rem", marginBottom: "25px", color: "var(--primary)" }}>DECRYPTION OFFLINE</h2>
            <p style={{ fontSize: "1.1rem", color: "#ccc", marginBottom: "40px", lineHeight: "1.6" }}>
              The Couture mainframe is currently sleeping... <br/>
              Registration protocols will initialize on <strong style={{color: 'white', letterSpacing: '1px'}}>{
                  globalLaunchDate.startsWith('2026-04-01T') 
                    ? 'April 1st' 
                    : new Date(globalLaunchDate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
              }</strong>.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", fontFamily: "Orbitron, sans-serif", flexWrap: "wrap" }}>
               <div style={{ background: "rgba(0,0,0,0.6)", padding: "15px", borderRadius: "8px", border: "1px solid var(--secondary)", minWidth: "75px" }}>
                 <div style={{ fontSize: "2rem", color: "white" }}>{timeLeft.days}</div>
                 <div style={{ fontSize: "0.8rem", color: "var(--secondary)", letterSpacing: "1px", marginTop: "5px" }}>DAYS</div>
               </div>
               <div style={{ background: "rgba(0,0,0,0.6)", padding: "15px", borderRadius: "8px", border: "1px solid var(--secondary)", minWidth: "75px" }}>
                 <div style={{ fontSize: "2rem", color: "white" }}>{timeLeft.hours}</div>
                 <div style={{ fontSize: "0.8rem", color: "var(--secondary)", letterSpacing: "1px", marginTop: "5px" }}>HRS</div>
               </div>
               <div style={{ background: "rgba(0,0,0,0.6)", padding: "15px", borderRadius: "8px", border: "1px solid var(--secondary)", minWidth: "75px" }}>
                 <div style={{ fontSize: "2rem", color: "white" }}>{timeLeft.minutes}</div>
                 <div style={{ fontSize: "0.8rem", color: "var(--secondary)", letterSpacing: "1px", marginTop: "5px" }}>MINS</div>
               </div>
               <div style={{ background: "rgba(0,0,0,0.6)", padding: "15px", borderRadius: "8px", border: "1px solid var(--secondary)", minWidth: "75px", borderColor: "var(--primary)" }}>
                 <div style={{ fontSize: "2rem", color: "var(--primary)" }}>{timeLeft.seconds}</div>
                 <div style={{ fontSize: "0.8rem", color: "var(--primary)", letterSpacing: "1px", marginTop: "5px" }}>SECS</div>
               </div>
            </div>
          </div>
        ) : (
          <form className="card fade-in" onSubmit={handleRegisterSubmit}>
            <h2>Registration</h2>
            {errorMsg && <div className="error-box">{errorMsg}</div>}
            <input placeholder="Team Name" required value={formData.team} onChange={e => setFormData({...formData, team: e.target.value})} />
            <input placeholder="Team Leader's Name" required value={formData.leader} onChange={e => setFormData({...formData, leader: e.target.value})} />
            <input type="number" placeholder="WhatsApp Number (10 digits)" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input placeholder="College" required value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})} />
            <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            
            <button type="submit" disabled={loading}>{loading ? 'Authenticating...' : 'Initialize Decode'}</button>
          </form>
        )
      )}

      {step === 2 && assignedCategory && (
        <div className="card puzzle-card fade-in">
          <h2 className="glitch" data-text="SYSTEM ENCRYPTED">SYSTEM ENCRYPTED</h2>
          <p>A category has been assigned. Decode ALL sectors to unlock themes.</p>
          <div className="puzzle-box">
             <h3>Category Locked: Sector {assignedCategory.id}</h3>
             
             {assignedCategory.puzzles.map((p, i) => (
                <div key={i} className="puzzle-item" style={{ marginBottom: "1.5rem", textAlign: "left", padding: "1rem", background: "rgba(0,0,0,0.3)", borderRadius: "8px" }}>
                   <div dangerouslySetInnerHTML={{ __html: p.text }} />
                   <div style={{ color: "var(--primary)", marginTop: "0.5rem", fontWeight: "bold" }}>({p.length} letters)</div>
                   <input 
                      placeholder={`Answer ${i+1}`} 
                      value={puzzleInputs[i]} 
                      style={{ marginTop: "0.5rem", width: "100%" }}
                      onChange={e => {
                         const copy = [...puzzleInputs];
                         copy[i] = e.target.value.toUpperCase();
                         setPuzzleInputs(copy);
                      }} 
                   />
                </div>
             ))}
             
          </div>
          {errorMsg && <div className="error-box">{errorMsg}</div>}
          <button onClick={checkPuzzles}>VERIFY DECRYPTION SEQUENCE</button>
        </div>
      )}

      {step === 3 && assignedCategory && (
        <div className="theme-selection fade-in">
          <h2 className="unlocked-text">CATEGORY UNLOCKED: {assignedCategory.name}</h2>
          <p style={{marginBottom: "1rem"}}>Select your specific design theme below to lock in your slot.</p>
          {errorMsg && <div className="error-box">{errorMsg}</div>}
          <div className="theme-grid">
            {assignedCategory.themes.map((themeObj, index) => {
              const currentCount = slotData.slots[themeObj.name] || 0;
              const isFull = currentCount >= slotData.max;
              const available = slotData.max - currentCount;
              
              return (
                <div key={index} className={`theme-card ${isFull ? 'disabled housefull' : ''}`} onClick={() => !isFull && !loading && selectTheme(themeObj.name)}>
                  <h3>{themeObj.name}</h3>
                  <p className="theme-desc" style={{ fontSize: "0.85rem", margin: "1rem 0", color: "#ccc", lineHeight: "1.4" }}>{themeObj.description}</p>
                  <div className="slot-badge">
                     {isFull ? "HOUSEFULL" : `${available}/${slotData.max} Available`}
                  </div>
                  {!isFull && <span style={{display: 'block', marginTop: '1rem', color: 'var(--primary)'}}>Select Theme →</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card success-card fade-in">
          <h1 className="success-icon">✅</h1>
          <h2>THEME SECURED</h2>
          <div className="summary">
            <p><strong>Team:</strong> {formData.team}</p>
            <p><strong>Category:</strong> {assignedCategory.name}</p>
            <p><strong>Theme:</strong> {finalTheme}</p>
          </div>
          <p className="footer-note">Take a screenshot now for the organizers!</p>
        </div>
      )}

      {step === 5 && (
         <AdminDashboard 
            token={adminToken} 
            isGlobalLaunched={isGlobalLaunched} 
            setIsGlobalLaunched={setIsGlobalLaunched} 
            globalLaunchDate={globalLaunchDate} 
            setGlobalLaunchDate={setGlobalLaunchDate} 
         />
      )}
    </div>
  );
}

function AdminDashboard({ token, isGlobalLaunched, setIsGlobalLaunched, globalLaunchDate, setGlobalLaunchDate }) {
  const [filterStr, setFilterStr] = useState('');
  const [entries, setEntries] = useState([]);
  
  const handleReload = async () => {
    try {
      const resp = await axios.get(`${API_URL}/entries`, { headers: { Authorization: token } });
      setEntries(resp.data);
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => { handleReload(); }, []);

  const handleToggleLaunch = async () => {
    if (!isGlobalLaunched) {
       if (window.confirm("Are you sure you want to GLOBALLY LAUNCH the event? The countdown will be permanently removed for all users!")) {
         try {
           await axios.post(`${API_URL}/status`, { isLaunched: true }, { headers: { Authorization: token } });
           setIsGlobalLaunched(true);
           alert("GLOBAL LAUNCH INITIATED! Registration is now completely open.");
         } catch(err) {
           alert("Failed to launch quiz stream.");
         }
       }
    } else {
       const newDateStr = prompt("The system is currently LAUNCHED.\n\nEnter the exact Date and Time to reopen (e.g. April 1, 2026 10:00 AM).\nThis will be processed in your local time zone (IST):", "April 1, 2026 10:00 AM");
       if (newDateStr) {
         try {
           const parsedDate = new Date(newDateStr);
           if (isNaN(parsedDate.getTime())) {
             alert("Invalid date format. Please use a format like 'April 1, 2026 10:00 AM'.");
             return;
           }
           const isoString = parsedDate.toISOString();
           await axios.post(`${API_URL}/status`, { isLaunched: false, launchDate: isoString }, { headers: { Authorization: token } });
           setIsGlobalLaunched(false);
           setGlobalLaunchDate(isoString);
           alert(`SYSTEM LOCKED.\nOffline countdown to ${parsedDate.toLocaleString("en-IN")} perfectly initialized!`);
         } catch(err) {
           alert("Failed to lock quiz stream.");
         }
       }
    }
  };

  const filtered = entries.filter(e => 
    e.team?.toLowerCase().includes(filterStr.toLowerCase()) || 
    e.college?.toLowerCase().includes(filterStr.toLowerCase()) ||
    e.category?.toLowerCase().includes(filterStr.toLowerCase()) ||
    e.theme?.toLowerCase().includes(filterStr.toLowerCase())
  );

  const exportToCSV = () => {
    if (entries.length === 0) return;
    
    // Create CSV rows mapping exactly to the database
    const headers = ["Team", "Leader", "Phone", "College", "Email", "Category", "Theme", "Time Taken", "Registration Time"];
    const rows = entries.map(e => {
      const formattedTime = e.timeTaken ? formatTimeAdmin(e.timeTaken) : "N/A";
      return [
        e.team, e.leader, e.phone, e.college, e.email, e.category, e.theme, formattedTime, e.timestamp
      ].map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(",");
    });
    
    // Blob and download
    const csvString = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `code_the_couture_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimeAdmin = (ms) => {
    if (ms == null) return "N/A";
    const mins = Math.floor(ms / 60000).toString().padStart(2, '0');
    const secs = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    const milli = (ms % 1000).toString().padStart(3, '0');
    return `${mins}:${secs}.${milli}`;
  };

  return (
    <div className="admin-dashboard fade-in">
       <h2>Admin Command Center</h2>
       
       <div className="admin-controls card">
         <input placeholder="Search Team, College, Category..." value={filterStr} onChange={e => setFilterStr(e.target.value)} />
         <button onClick={handleReload}>↻ Refresh Data</button>
         <button onClick={exportToCSV} style={{background: 'var(--secondary)', color: 'black'}}>📥 Export Excel</button>
         <button onClick={handleToggleLaunch} style={{background: isGlobalLaunched ? '#ff3366' : '#00ff6a', color: isGlobalLaunched ? 'white' : 'black'}}>
             {isGlobalLaunched ? '🛑 STOP QUIZ' : '🚀 LAUNCH QUIZ'}
         </button>
       </div>

        <div className="admin-table-wrapper">
         <table className="admin-table">
           <thead>
             <tr>
               <th>Team</th>
               <th>Leader</th>
               <th>Phone</th>
               <th>College</th>
               <th>Category</th>
               <th>Theme</th>
               <th>Time Taken</th>
               <th>Registered</th>
             </tr>
           </thead>
           <tbody>
             {filtered.map((e, idx) => (
               <tr key={idx}>
                 <td>{e.team}</td>
                 <td>{e.leader}</td>
                 <td>{e.phone}</td>
                 <td>{e.college}</td>
                 <td>{e.category}</td>
                 <td>{e.theme}</td>
                 <td style={{fontFamily: 'monospace', color: 'var(--primary)'}}>{formatTimeAdmin(e.timeTaken)}</td>
                 <td>{e.timestamp}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
    </div>
  )
}

export default App;