import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Detection from './Detection';
import Rules from './Rules';
function App() {
  
  return (

    <Router>
    <Routes>
      <Route path="/SR_SignLanguageRecognition" element={<Detection />} />
      <Route path="/SR_SignLanguageRules" element={<Rules />} />
    </Routes>
  </Router>

  );

}
export default App;
