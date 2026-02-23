import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { FaArrowLeft, FaShieldAlt, FaRegBell, FaUserEdit, FaCamera, FaSave, FaTimes } from "react-icons/fa";

import { IoMdRocket } from "react-icons/io";

import { CiSettings } from "react-icons/ci";

import { IoIosLogOut } from "react-icons/io";



// IMPORTANT: This import path must correctly point to your SidebarShell

import SidebarShell from '../../chatspace/components/SidebarShell.jsx';



export default function Settings() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [isEditing, setIsEditing] = useState(false);

    const [user, setUser] = useState({
        name: "VisionDesk User",
        email: "user@visiondesk.app",
        avatar: null
    });

    // Load user data on mount with error handling to prevent blank page
    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('vd_user_profile');
            if (savedUser) {
                const parsedUser = JSON.parse(savedUser);
                // Only update if the parsed data actually exists
                if (parsedUser) {
                    setUser(parsedUser);
                }
            }
        } catch (error) {
            console.error("Failed to load user profile from storage:", error);
            // If it fails, we just keep the default state instead of crashing
        }
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUser(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        setIsEditing(false);
        localStorage.setItem('vd_user_profile', JSON.stringify(user));
    };

    return (

        /* This Flex container is what keeps the sidebar at the side */

        <div className="flex min-h-screen bg-slate-950 text-slate-50">



            {/* 1. The Constant Sidebar */}

            <SidebarShell />



            {/* 2. The Main Content Area */}

            <main className="flex-1 overflow-y-auto p-8 lg:p-12">





                <div className="max-w-5xl mx-auto">

                    {/* --- FUNCTIONAL PROFILE SECTION --- */}

                    <section className="mb-10">

                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-5">Account Profile</h2>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-black/20">



                            {/* Avatar with Upload Logic */}

                            <div className="relative group">

                                <div className="w-24 h-24 rounded-2xl bg-indigo-600 overflow-hidden flex items-center justify-center text-2xl font-bold shadow-xl shadow-indigo-600/20 border-2 border-slate-800">

                                    {user.avatar ? (

                                        <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />

                                    ) : (

                                        "VD"

                                    )}

                                </div>

                                <input

                                    type="file"

                                    ref={fileInputRef}

                                    className="hidden"

                                    accept="image/*"

                                    onChange={handleImageChange}

                                />

                                <button

                                    onClick={() => fileInputRef.current.click()}

                                    className="absolute -bottom-2 -right-2 p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all shadow-lg"

                                    title="Upload Photo"

                                >

                                    <FaCamera size={14} />

                                </button>

                            </div>



                            <div className="flex-1 text-center md:text-left">

                                {isEditing ? (

                                    <div className="space-y-3">

                                        <input

                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 font-medium"

                                            value={user.name}

                                            onChange={(e) => setUser({ ...user, name: e.target.value })}

                                            placeholder="Full Name"

                                        />

                                        <input

                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 font-medium"

                                            value={user.email}

                                            onChange={(e) => setUser({ ...user, email: e.target.value })}

                                            placeholder="Email Address"

                                        />

                                        <div className="flex gap-2 justify-center md:justify-start">

                                            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20">

                                                <FaSave /> Save Changes

                                            </button>

                                            <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-600 transition-all">

                                                <FaTimes /> Cancel

                                            </button>

                                        </div>

                                    </div>

                                ) : (

                                    <>

                                        <h3 className="text-2xl font-bold text-white mb-1">{user.name}</h3>

                                        <p className="text-sm text-slate-500 mb-4 font-medium">{user.email}</p>

                                        <button

                                            onClick={() => setIsEditing(true)}

                                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-md"

                                        >

                                            <FaUserEdit size={14} /> Edit Profile

                                        </button>

                                    </>

                                )}

                            </div>

                        </div>

                    </section>



                    {/* --- APP PREFERENCES --- */}

                    <div className="flex items-center gap-3 mb-6">

                        <CiSettings className="text-2xl text-indigo-400" />

                        <h2 className="text-xl font-bold">App Preferences</h2>

                    </div>



                    <div className="space-y-4">

                        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">

                            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">

                                <div className="flex items-center gap-3">

                                    <div className="p-2 bg-slate-800 rounded-lg text-indigo-400">

                                        <IoMdRocket size={18} />

                                    </div>

                                    <div>

                                        <p className="font-semibold text-sm text-slate-200">System Startup</p>

                                        <p className="text-xs text-slate-500">Launch VisionDesk on system startup</p>

                                    </div>

                                </div>

                                <input type="checkbox" className="w-4 h-4 accent-indigo-500 cursor-pointer" />

                            </div>



                            <div className="px-6 py-5 flex items-center justify-between">

                                <div className="flex items-center gap-3">

                                    <div className="p-2 bg-slate-800 rounded-lg text-indigo-400">

                                        <FaRegBell size={18} />

                                    </div>

                                    <div>

                                        <p className="font-semibold text-sm text-slate-200">Notifications</p>

                                        <p className="text-xs text-slate-500">Enable desktop notifications</p>

                                    </div>

                                </div>

                                <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-500 cursor-pointer" />

                            </div>

                        </section>



                        <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex items-center justify-between shadow-lg shadow-red-900/5">

                            <div>

                                <p className="font-bold text-red-400 text-sm mb-0.5">Session Security</p>

                                <p className="text-xs text-slate-500">Log out of your current session</p>

                            </div>

                            <button

                                onClick={() => navigate('/login')}

                                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-5 py-2.5 border border-red-500/20 rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-500/10"

                            >

                                <IoIosLogOut size={16} /> Logout

                            </button>

                        </section>

                    </div>

                </div>

            </main>

        </div>

    );

}