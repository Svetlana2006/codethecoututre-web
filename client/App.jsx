import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CATEGORIES, MAX_SLOTS_PER_THEME } from './data';
import './App.css';

function App() {
  const [step, setStep] = useState(1); // 1 = Form, 2 = Puzzle, 3 = Theme, 4 = Success, 5 = Admin
  const [formData, setFormData] = useState({
    team: '', leader: '', phone: '', college: '', email: ''
  });
  const [sessionId, setSessionId] = useState("");
  const [assignedCategory, setAssignedCategory] = useState(null);
  const [assignedPuzzleIndex, setAssignedPuzzleIndex] = useState(0);
  const [puzzleInput, setPuzzleInput] = useState("");
  const [finalTheme, setFinalTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [adminToken, setAdminToken] = useState("");
  const [slotData, setSlotData] = useState({ slots: {}, max: 3 });

  // Fetch slots immediately so duplicate checks are quick
  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const resp = await axios.get('/api/slots');
      setSlotData(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const resp = await axios.post('/api/register', formData);
      
      if (resp.data.kind === "admin") {
         setAdminToken(resp.data.token);
         setStep(5);
         setLoading(false);
         return;
      }
      
      setSessionId(resp.data.id);
      const cat = CATEGORIES.find(c => c.name === resp.data.categoryName);
      setAssignedCategory(cat);
      setAssignedPuzzleIndex(resp.data.puzzleIndex);
      setStep(2);
    } catch(err) {
      setErrorMsg(err.response?.data?.error || "Registration failed. Please try again.");
    }
    setLoading(false);
  };

  const checkPuzzle = () => {
    const correctAnswer = assignedCategory.puzzles[assignedPuzzleIndex].answer.toLowerCase();
    if (puzzleInput.toLowerCase().includes(correctAnswer)) {
      setStep(3);
      setErrorMsg('');
    } else {
      setErrorMsg("System access denied. Re-check your decoding logic! ⚡");
    }
  };

  const selectTheme = async (themeName) => {
    setLoading(true);
    setErrorMsg('');

    try {
      await axios.post('/api/theme', { 
         id: sessionId, 
         themeName, 
         puzzleAnswer: puzzleInput 
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
             <h3>Category Locked: Sector {assignedCategory.id}</h3>
             <div dangerouslySetInnerHTML={{ __html: assignedCategory.puzzles[assignedPuzzleIndex].text }} />
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
              const currentCount = slotData.slots[themeName] || 0;
              const isFull = currentCount >= slotData.max;
              const available = slotData.max - currentCount;
              
              return (
                <div key={index} className={`theme-card ${isFull ? 'disabled housefull' : ''}`} onClick={() => !isFull && !loading && selectTheme(themeName)}>
                  <h3>{themeName}</h3>
                  <div className="slot-badge">
                     {isFull ? "HOUSEFULL" : `${available}/${slotData.max} Available`}
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
         <AdminDashboard token={adminToken} />
      )}
    </div>
  );
}

function AdminDashboard({ token }) {
  const [filterStr, setFilterStr] = useState('');
  const [entries, setEntries] = useState([]);
  
  const handleReload = async () => {
    try {
      const resp = await axios.get('/api/entries', { headers: { Authorization: token } });
      setEntries(resp.data);
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => { handleReload(); }, []);

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