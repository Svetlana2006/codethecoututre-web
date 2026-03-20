import React, { useState } from 'react';

const THEME_DATA = { /* ... paste the same JSON data from the previous code ... */ };

export default function CodeTheCouture() {
  const [step, setStep] = useState(1);
  const [teamInfo, setTeamInfo] = useState({ name: '', leader: '', phone: '' });
  const [category, setCategory] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [finalSelection, setFinalSelection] = useState(null);

  // 1. Initialize Registration & Randomize Category
  const handleRegister = (e) => {
    e.preventDefault();
    const keys = Object.keys(THEME_DATA);
    const randomCat = keys[Math.floor(Math.random() * keys.length)];
    setCategory(randomCat);
    setStep(2);
  };

  // 2. Verify Puzzle
  const verifyPuzzle = () => {
    if (userInput.toLowerCase().includes(THEME_DATA[category].answer)) {
      setStep(3);
    } else {
      alert("Decode Failed! Try again.");
    }
  };

  // 3. Finalize and Submit to Backend
  const selectTheme = async (theme) => {
    const payload = { ...teamInfo, category, theme };
    setFinalSelection(payload);
    setStep(4);

    // POST to Google Sheets API
    await fetch('YOUR_GOOGLE_SCRIPT_URL', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  };

  return (
    <div className="container">
      {step === 1 && (
        <form onSubmit={handleRegister}>
          <h2>Team Registration</h2>
          <input placeholder="Team Name" onChange={e => setTeamInfo({...teamInfo, name: e.target.value})} required />
          <button type="submit">Initialize Decode</button>
        </form>
      )}

      {step === 2 && (
        <div className="puzzle-container">
          <h2>System Encrypted</h2>
          <div dangerouslySetInnerHTML={{ __html: THEME_DATA[category].puzzle }} />
          <input placeholder="Your Answer" onChange={e => setUserInput(e.target.value)} />
          <button onClick={verifyPuzzle}>Verify</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Unlocked: {category}</h2>
          {THEME_DATA[category].themes.map(t => (
            <div key={t.t} className="card" onClick={() => selectTheme(t.t)}>
              <h3>{t.t}</h3>
              <p>{t.d}</p>
            </div>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="success">
          <h2>LOCKED IN ✅</h2>
          <p>{finalSelection.theme} assigned to {finalSelection.name}</p>
        </div>
      )}
    </div>
  );
}
