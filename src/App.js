import './App.css';
import React from 'react';
import {  Route, Routes } from 'react-router-dom';
import Detection from './Detection';
import Rules from './Rules';
function App() {
  
  return (

    <Routes>
      <Route path="/" element={<Detection />} />
      <Route path="/SR_SignLanguageRules" element={<Rules />} />
    </Routes>

  );

}
export default App;
