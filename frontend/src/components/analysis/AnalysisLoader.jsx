import React from 'react';
import { Droplets, CloudRain } from 'lucide-react';

export default function AnalysisLoader() {
  return <div className="analysis-loader-overlay">
    <div className="rain-field">{Array.from({length:18}).map((_,i)=><span key={i} style={{left:`${(i*17)%100}%`,animationDelay:`${(i%7)*0.18}s`}}/> )}</div>
    <div className="loader-drop"><Droplets size={50}/><div className="ripple r1"/><div className="ripple r2"/></div>
    <CloudRain size={28} className="cloud-icon"/>
    <h3>Analyzing Water Parameters</h3>
    <p>Please wait while we process your data...</p>
    <div className="progress-track"><div className="progress-fill"/></div>
    <small>Running AI model and generating explanation...</small>
  </div>;
}
