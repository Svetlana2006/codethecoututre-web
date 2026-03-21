import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CATEGORIES, MAX_SLOTS_PER_THEME, SHEET_API_URL } from './data';
import './App.css';

function App() {
  const [step, setStep] = useState(1); // 1 = Form, 2 = Puzzle, 3 = Theme, 4 = Success, 5 = Admin
  const [formData, setFormData] = useState({
    team: '', leader: '', phone: '', college: '', email: ''
  });
  const [allEntries, setAllEntries] = useState([]);
  const [assignedCategory, setAssignedCategory] = useState(null);
  const [puzzleInput, setPuzzleInput] = useState("");
  const [finalTheme, setFinalTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch entries immediately so duplicate checks are quick
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const resp = await axios.get(SHEET_API_URL);
      setAllEntries(resp.data);
      return resp.data;
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const checkAdmin = () => {
    return formData.team.trim() === 'admin' && 
           formData.leader.trim() === 'admin' && 
           formData.phone.trim() === '9999999999' && 
           formData.college.trim().toUpperCase() === 'CIC' && 
           formData.email.trim() === 'admin@gmail.com';
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (checkAdmin()) {
      setStep(5);
      return;
    }

    if (formData.phone.length !== 10) {
      setErrorMsg("WhatsApp number must be exactly 10 digits");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const entries = await fetchEntries();
    
    // Duplicate checks
    const isDuplicatePhone = entries.some(entry => entry.phone === formData.phone);
    const isDuplicateTeam = entries.some(entry => entry.team.toLowerCase() === formData.team.toLowerCase());
    
    if (isDuplicatePhone) {
      setErrorMsg("This WhatsApp number has already been registered.");
      setLoading(false);
      return;
    }
    if (isDuplicateTeam) {
      setErrorMsg("This Team Name is already taken.");
      setLoading(false);
      return;
    }

    // Determine category via round robin
    const catIndex = entries.length % CATEGORIES.length;
    setAssignedCategory(CATEGORIES[catIndex]);
    
    setStep(2);
    setLoading(false);
  };

  const checkPuzzle = () => {
    if (puzzleInput.toLowerCase().includes(assignedCategory.answer.toLowerCase())) {
      setStep(3);
      setErrorMsg('');
    } else {
      setErrorMsg("System access denied. Re-check your decoding logic! ⚡");
    }
  };

  const selectTheme = async (themeName) => {
    setLoading(true);
    setErrorMsg('');
    // Re-verify slots right before posting
    const entries = await fetchEntries();
    
    const themeCount = entries.filter(e => e.theme === themeName).length;
    if (themeCount >= MAX_SLOTS_PER_THEME) {
       setErrorMsg(`Try quicker with another theme. '${themeName}' just got filled up by another team!`);
       setLoading(false);
       return;
    }

    const timestampNow = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
    
    const finalData = { 
      timestamp: timestampNow,
      team: formData.team, 
      leader: formData.leader,
      phone: formData.phone,
      college: formData.college,
      email: formData.email,
      category: assignedCategory.name, 
      puzzleAnswer: puzzleInput,
      theme: themeName,
      status: "SECURED"
    };

    try {
      await axios.post(SHEET_API_URL, finalData, {
        headers: { 'Content-Type': 'application/json' }
      });
      setFinalTheme(themeName);
      setStep(4);
    } catch (err) {
      setErrorMsg("Cloud upload failed. Please try clicking select again or contact organizers.");
    }
    setLoading(false);
  };

  // --- RENDERING ---

  return (
    <div className="app-container">
      <header>
        <h1>🔥 CODE THE COUTURE</h1>
        <p className="subtitle">DECODE • DESIGN • DISRUPT</p>
      </header>

      {step === 1 && (
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
      )}

      {step === 2 && assignedCategory && (
        <div className="card fade-in">
          <h2 className="glitch">SYSTEM ENCRYPTED</h2>
          <p>A category has been assigned. Decode it to unlock themes.</p>
          <div className="puzzle-box">
             <h3>Category Locked: {assignedCategory.name}</h3>
             <div dangerouslySetInnerHTML={{ __html: assignedCategory.puzzle }} />
          </div>
          {errorMsg && <div className="error-box">{errorMsg}</div>}
          <input placeholder="Your Answer" value={puzzleInput} onChange={e => setPuzzleInput(e.target.value)} />
          <button onClick={checkPuzzle}>Verify Protocol</button>
        </div>
      )}

      {step === 3 && assignedCategory && (
        <div className="theme-selection fade-in">
          <h2 className="unlocked-text">CATEGORY UNLOCKED: {assignedCategory.name}</h2>
          {errorMsg && <div className="error-box">{errorMsg}</div>}
          <div className="theme-grid">
            {assignedCategory.themes.map((themeName, index) => {
              const currentCount = allEntries.filter(e => e.theme === themeName).length;
              const isFull = currentCount >= MAX_SLOTS_PER_THEME;
              const available = MAX_SLOTS_PER_THEME - currentCount;
              
              return (
                <div key={index} className={`theme-card ${isFull ? 'disabled housefull' : ''}`} onClick={() => !isFull && !loading && selectTheme(themeName)}>
                  <h3>{themeName}</h3>
                  <div className="slot-badge">
                     {isFull ? "HOUSEFULL" : `${available}/${MAX_SLOTS_PER_THEME} Available`}
                  </div>
                  {!isFull && <span>Select →</span>}
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
         <AdminDashboard entries={allEntries} reload={fetchEntries} />
      )}
    </div>
  );
}

function AdminDashboard({ entries, reload }) {
  const [filterStr, setFilterStr] = useState('');
  
  const handleReload = async () => {
    await reload();
  };

  const filtered = entries.filter(e => 
    e.team?.toLowerCase().includes(filterStr.toLowerCase()) || 
    e.college?.toLowerCase().includes(filterStr.toLowerCase()) ||
    e.category?.toLowerCase().includes(filterStr.toLowerCase()) ||
    e.theme?.toLowerCase().includes(filterStr.toLowerCase())
  );

  return (
    <div className="admin-dashboard fade-in">
       <h2>Admin Command Center</h2>
       
       <div className="admin-controls card">
         <input placeholder="Search Team, College, Category..." value={filterStr} onChange={e => setFilterStr(e.target.value)} />
         <button onClick={handleReload}>↻ Refresh Data</button>
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
               <th>Time</th>
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