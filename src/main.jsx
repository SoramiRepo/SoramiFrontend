import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfileComponent from './components/ProfileComponent';
import OtherUserProfileComponent from './components/OtherUserProfileComponent';
// import PostDetail from './PostDetail';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* HomePage 作为 Layout 外壳 */}
        <Route path="/" element={<HomePage />}>
          <Route path="/profile" element={<ProfileComponent />} />
          <Route path="/:username" element={<OtherUserProfileComponent />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
