import React, { useState } from 'react';
import './App.css';

const DATA = {
  "AI X FUTURE": {
    puzzle: "<b>__ X ______</b><br/><br/>1. <b>__</b> = 01000001 01001001<br/>2. <b>______</b> = I am always ahead of you but never arrive. If you look at me in a mirror, I am exactly where I was. What am I?",
    answer: "ai future",
    themes: [
      { t: "Half Code, Half Human", d: "Split between logic and emotion." },
      { t: "Watched All the Time", d: "Surveillance & data tracking." },
      { t: "Controlled by the Feed", d: "Algorithm addiction." },
      { t: "War Against AI", d: "Humanity fighting back - cardboard armor." },
      { t: "Bio-Hacked Human", d: "Genetically modified - leaf + wire fusion." }
    ]
  },
  "EARTH & CLIMATE": {
    puzzle: "<b>_____ & _______</b><br/>LAME CITED THRASH<br/><br/>Remove <b>'H'</b> from THRASH and <b>'D'</b> from CITED. Rearrange remaining letters.",
    answer: "earth climate",
    themes: [
      { t: "The Air We Wear", d: "Surviving toxic air - masks and filters." },
      { t: "Plastic Mermaid", d: "Ocean waste - bottles and nets." },
      { t: "Nature Strikes Back", d: "Mother Nature reclaiming space." },
      { t: "Earth on Fever", d: "Global warming - red patches & cracked earth." }
    ]
  },
  "ENERGY": {
    puzzle: "I cannot be created, and I refuse to be destroyed; I only change my forms. Einstein calls me mc². What am I?",
    answer: "energy",
    themes: [
      { t: "Solar Saviour", d: "CDs and mirrors to reflect sunlight." },
      { t: "Human Battery", d: "Living source of power." },
      { t: "Power from Waste", d: "Transforming discarded trash into power." }
    ]
  },
  "CULTURE & MEDIA": {
    puzzle: "What spreads faster than truth but dies in 24 hours? I am the currency of the digital age. (Starts with V)",
    answer: "viral",
    themes: [
      { t: "CC - Clickbait Couture", d: "Dramatic headlines and caution tape." },
      { t: "The Walking Billboard", d: "Humans as advertisements and logos." },
      { t: "Filtered Life", d: "Fake perfection - smooth vs chaotic." }
    ]
  },
  "SOCIETY & ECONOMY": {
    puzzle: "I define your value but I am just paper or code. If I crash, the world panics. What am I?",
    answer: "money",
    themes: [
      { t: "Walking Economy Crash", d: "Inflation chaos - fake notes." },
      { t: "Consumerism Monster", d: "Walking product of endless buying." },
      { t: "Rich vs Poor Divide", d: "Dual economy - glam vs survival." }
    ]
  }
};

function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ team: '', leader: '', phone: '', college: '' });
  const [category, setCategory] = useState("");
  const [puzzleInput, setPuzzleInput] = useState("");
  const [finalTheme, setFinalTheme] = useState("");

  const handleStart = (e) => {
    e.preventDefault();
    const cats = Object.keys(DATA);
    setCategory(cats[Math.floor(Math.random() * cats.length)]);
    setStep(2);
  };

  const checkPuzzle = () => {
    if (puzzleInput.toLowerCase().includes(DATA[category].answer)) {
      setStep(3);
    } else {
      alert("System access denied. Re-check your decoding logic! ⚡");
    }
  };

 const selectTheme = async (themeName) => {
    // 1. Prepare the data object
    const finalData = { 
      ...formData, 
      category: category, 
      theme: themeName,
      timestamp: new Date().toLocaleString() 
    };

    // 2. Update the UI immediately so the user sees the success screen
    setFinalTheme(themeName);
    setStep(4);

    // 3. Send the data to your Google Sheet (via Sheet.best or Apps Script)
    try {
      await fetch('YOUR_SHEET_BEST_URL_HERE', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalData),
      });
      console.log("Data successfully sent to Sheet!");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Registration saved locally, but failed to upload to the cloud. Please show your screenshot to the coordinator!");
    }
  }; 
  return (
    <div className="app-container">
      <header>
        <h1>🔥 CODE THE COUTURE</h1>
        <p className="subtitle">DECODE • DESIGN • DISRUPT</p>
      </header>

      {step === 1 && (
        <form className="card" onSubmit={handleStart}>
          <h2>Registration</h2>
          <input placeholder="Team Name" required onChange={e => setFormData({...formData, team: e.target.value})} />
          <input placeholder="Leader Name" required onChange={e => setFormData({...formData, leader: e.target.value})} />
          <input placeholder="Phone Number" required onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input placeholder="College" required onChange={e => setFormData({...formData, college: e.target.value})} />
          <button type="submit">Initialize Decode</button>
        </form>
      )}

      {step === 2 && (
        <div className="card">
          <h2 className="glitch">SYSTEM ENCRYPTED</h2>
          <p>A category has been assigned. Decode it to unlock themes.</p>
          <div className="puzzle-box" dangerouslySetInnerHTML={{ __html: DATA[category].puzzle }} />
          <input placeholder="Your Answer" onChange={e => setPuzzleInput(e.target.value)} />
          <button onClick={checkPuzzle}>Verify Protocol</button>
        </div>
      )}

      {step === 3 && (
        <div className="theme-selection">
          <h2 className="unlocked-text">CATEGORY UNLOCKED: {category}</h2>
          <div className="theme-grid">
            {DATA[category].themes.map((item, index) => (
              <div key={index} className="theme-card" onClick={() => selectTheme(item.t)}>
                <h3>{item.t}</h3>
                <p>{item.d}</p>
                <span>Select →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card success-card">
          <h1 className="success-icon">✅</h1>
          <h2>THEME SECURED</h2>
          <div className="summary">
            <p><strong>Team:</strong> {formData.team}</p>
            <p><strong>Category:</strong> {category}</p>
            <p><strong>Theme:</strong> {finalTheme}</p>
          </div>
          <p className="footer-note">Take a screenshot now for the organizers!</p>
        </div>
      )}
    </div>
  );
}

export default App;