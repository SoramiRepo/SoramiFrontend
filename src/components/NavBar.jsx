import React from 'react';
import { useLocation, Link } from 'react-router-dom';

function NavBar({ handleSidebarToggle, isSidebarOpen, user }) {
    const location = useLocation(); // 获取当前路由位置

    return (
        <div className="fixed top-0 left-0 w-full bg-[#F6F8FA80] dark:bg-[#33415550] py-4 px-6 shadow-lg z-40 backdrop-blur-xs">
            <div className="flex items-center justify-between relative h-[50px] max-h-[50px]">
                {/* 左侧：菜单按钮 */}
                {!isSidebarOpen && (
                    <button
                        onClick={handleSidebarToggle}
                        className="w-[42px] h-[42px] bg-transparent hover:text-white z-50 
                        text-black p-2 border-0 rounded-full lg:hidden dark:text-white
                        hover:shadow-xl transition-all duration-300 ease-in-out transform active:scale-90 text-3xl"
                    >
                        &#9776;
                    </button>
                )}

                {/* 中间：Logo */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <img src="/resource/logo.png" alt="Logo" className="w-[40px]" />
                </div>

                {/* 右侧：头像 */}
                <div>
                    <Link to="/profile">
                        <img
                            src={user?.avatarimg || '/resource/default-avatar.png'}
                            alt="Avatar"
                            className="absolute right-[20px] top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[30px] h-[30px] rounded-full border-0 border-gray-500 shadow-md object-cover cursor-pointer"
                        />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default NavBar;
