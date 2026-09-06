import React from 'react';
import './Splash.css';

export default function Splash({ onFinish }) {
  return (
    <div className="splash-container" onClick={onFinish}>
      <div className="circle-bg circle-1"></div>
      <div className="circle-bg circle-2"></div>
      <div className="circle-bg circle-3"></div>
      <div className="circle-bg circle-4"></div>
      <div className="circle-bg circle-5"></div>
      
      <div className="particle p1"></div>
      <div className="particle p2"></div>
      <div className="particle p3"></div>
      <div className="particle p4"></div>
      <div className="particle p5"></div>

      <img src="/earth.png" alt="Earth Globe" className="globe" />
      
      <div className="content-container">
        <div className="logo-container">
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white">
              <circle cx="10" cy="10" r="8" strokeWidth="1.6"></circle>
              <line x1="2" y1="10" x2="18" y2="10" strokeWidth="1.2"></line>
              <line x1="10" y1="2" x2="10" y2="18" strokeWidth="1.2"></line>
              <ellipse cx="10" cy="10" rx="4" ry="8" strokeWidth="1.2"></ellipse>
            </svg>
          </div>
          <div className="logo-text">SatQuery AI</div>
        </div>
        
        <div className="tagline-1">ASK · ANALYZE · UNDERSTAND</div>
        <div className="tagline-2">AI-powered intelligence for the Earth.</div>
      </div>
      
      <div className="loading-container">
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        <div className="loading-text">INITIALIZING GLOBAL NETWORK ...</div>
      </div>
    </div>
  );
}
