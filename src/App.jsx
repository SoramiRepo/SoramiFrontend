import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import i18n from './i18n'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfileComponent from './components/ProfileComponent'
import OtherUserProfileComponent from './components/OtherUserProfileComponent'
import SearchPage from './pages/SearchPage'
import EditProfile from './components/EditProfile'
import NotificationPage from './pages/NotificationPage'
import PostPage from './pages/PostPage'
import ResetPwd from './pages/ResetPwd'

export default function App() {
    useEffect(() => {
        const lang = localStorage.getItem('i18nextLng')
        if (lang && lang !== i18n.language) {
            i18n.changeLanguage(lang)
        }
    }, [])

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/resetpwd" element={<ResetPwd />} />
            <Route path="/" element={<HomePage />}>
                <Route path="profile" element={<ProfileComponent />} />
                <Route path="search" element={<SearchPage />} />
                <Route path=":username" element={<OtherUserProfileComponent />} />
                <Route path="edit-profile" element={<EditProfile />} />
                <Route path="notifications" element={<NotificationPage />} />
                <Route path="post/:id" element={<PostPage />} />
            </Route>
        </Routes>
    )
}
