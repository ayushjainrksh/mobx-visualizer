import React from 'react';
import './App.css';
import States from './components/States';

function App() {
  return (
    <div className="App">
      <div className="App__header">
        Mobx Visualizer
      </div>
      <States />
    </div>
  );
}

export default App;
