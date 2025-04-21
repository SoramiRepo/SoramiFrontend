import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfileComponent from './components/ProfileComponent';
import OtherUserProfileComponent from './components/OtherUserProfileComponent';
import { ToastProvider } from './components/ToastContext';
import SearchPage from './pages/SearchPage';
import EditProfile from './components/EditProfile';
import './index.css';
import PostPage from './pages/PostPage';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <ToastProvider>
    <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* HomePage 作为 Layout 外壳 */}
        <Route path="/" element={<HomePage />}>
          <Route path="/profile" element={<ProfileComponent />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/:username" element={<OtherUserProfileComponent />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/post/:id" element={<PostPage />} />
        </Route>
      </Routes>
    </ToastProvider>
      
    </BrowserRouter>
  </React.StrictMode>
);
