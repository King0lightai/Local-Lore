import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NovelList from './components/NovelList';
import WritingInterface from './components/WritingInterface';
import { ThemeProvider } from './contexts/ThemeContext';
import axios from 'axios';

function App() {
  const [novels, setNovels] = useState([]);
  const [selectedNovel, setSelectedNovel] = useState(null);

  useEffect(() => {
    fetchNovels();
  }, []);

  const fetchNovels = async () => {
    try {
      const response = await axios.get('/api/novels');
      setNovels(response.data);
    } catch (error) {
      console.error('Error fetching novels:', error);
    }
  };

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<NovelList novels={novels} onRefresh={fetchNovels} />} />
          <Route path="/novel/:id" element={<WritingInterface />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;