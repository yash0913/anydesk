import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaRegMessage } from "react-icons/fa6";
import { SiGooglemeet } from "react-icons/si";
import { CiSettings } from "react-icons/ci";
import { FaRegStar } from "react-icons/fa";
import { IoMdContacts } from "react-icons/io";
import { IoIosLogOut } from "react-icons/io";
import { HiLightningBolt } from "react-icons/hi";
import { MdAnalytics } from "react-icons/md";
import DeskLinkSidebarEntry from '../../desklink/components/DeskLinkSidebarEntry.jsx';

const navItems = [
  { id: 'messages', label: 'Messages', icon: <FaRegMessage />, path: '/workspace/messages' },
  { id: 'contacts', label: 'Contacts', icon: <IoMdContacts />, path: '/workspace/messages?view=contacts' },
  { id: 'starred', label: 'Starred', icon: <FaRegStar />, path: '/workspace/starred' },
  { id: 'settings', label: 'Settings', icon: <CiSettings />, path: '/workspace/settings' },
  { id: 'meet', label: 'Meet', icon: <SiGooglemeet />, path: '/workspace/meet' },
];

export default function SidebarShell() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('vd_auth_token');
    navigate('/login', { replace: true });
  };

  return (
    <aside className="flex flex-col items-center justify-between w-16 bg-slate-900 border-r border-slate-800 py-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => navigate('/workspace/dashboard')} // Make the logo clickable to go home
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform duration-200 ease-out"
            title="VisionDesk Home"
          >
            {/* This icon represents speed and remote connectivity */}
            <HiLightningBolt className="text-2xl drop-shadow-md" />
          </button>

          <div className="mt-4 flex flex-col items-center gap-3">
            {/* navItems mapping remains here */}
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-3">
          {navItems.map((item) => {
            const isActive = location.pathname + location.search === item.path || location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-colors hover:bg-slate-800 ${isActive ? 'bg-slate-800 text-indigo-400' : 'text-slate-400'
                  }`}
                title={item.label}
              >
                <span>{item.icon}</span>
              </button>
            );
          })}

          {/* DeskLink entry */}
          <DeskLinkSidebarEntry />
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        title="Logout"
      >
        <IoIosLogOut />

      </button>
    </aside>
  );
}
