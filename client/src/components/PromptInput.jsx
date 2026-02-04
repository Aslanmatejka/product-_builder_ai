import React, { useState } from 'react';
import './PromptInput.css';

function PromptInput({ onBuild, isBuilding, hasExistingDesign }) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && !isBuilding) {
      onBuild(prompt);
      setPrompt(''); // Clear input after submission
    }
  };

  return (
    <div className="prompt-input">
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={hasExistingDesign 
            ? "Tell me how you'd like to change it...\n\nFor example:\n• Make it 20mm taller\n• Add a USB port on the right side\n• Make the walls thicker"
            : "What would you like to make?\n\nFor example:\n• A small box for Arduino with USB opening\n• Battery cover for 4 AA batteries\n• Raspberry Pi case with ventilation"}
          rows={4}
          disabled={isBuilding}
        />
        <button 
          type="submit" 
          disabled={!prompt.trim() || isBuilding}
          className="build-button"
        >
          {isBuilding ? 'Working on it...' : hasExistingDesign ? 'Update Design' : 'Create It'}
        </button>
      </form>
    </div>
  );
}

export default PromptInput;
