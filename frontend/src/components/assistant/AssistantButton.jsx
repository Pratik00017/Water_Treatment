import React from 'react';
import { Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AssistantButton() {
  const navigate = useNavigate();
  return <button className="assistant-fab" onClick={() => navigate('/assistant')} aria-label="Open Aqua Assistant"><Bot size={23}/></button>;
}
