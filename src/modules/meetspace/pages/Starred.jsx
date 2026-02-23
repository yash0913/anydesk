import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaRegStar, FaLaptop, FaDesktop, FaCircle } from "react-icons/fa";

// Correct path based on your folder structure
import SidebarShell from '../../chatspace/components/SidebarShell.jsx';

export default function Starred() {
    const navigate = useNavigate();

    // Dummy for layout demo
    const starredDevices = [
        { id: 1, name: "Yash - Laptop", status: "Online", type: "laptop" },
        { id: 2, name: "Office Desktop", status: "Offline", type: "desktop" },
        { id: 3, name: "Home Media PC", status: "Online", type: "desktop" }
    ];

    // Navigation Handler for DeskLink
    const handleStartSession = (deviceId) => {
        // Navigates to the DeskLink page
        // You can also pass the deviceId if your route supports it: `/workspace/desklink/${deviceId}`
        navigate('/workspace/desklink');
    };

    return (
        /* FLEX WRAPPER: Keeps Sidebar and Main content side-by-side */
        <div className="flex min-h-screen bg-slate-950 text-slate-50">

            {/* 1. Constant Sidebar */}
            <SidebarShell />

            {/* 2. Main Content */}
            <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative">

                {/* Background Decor */}
                <div className="pointer-events-none absolute inset-0 opacity-40">
                    <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl" />
                </div>

                <div className="relative z-10 max-w-6xl mx-auto">



                    {/* Header */}
                    <header className="flex items-center gap-4 mb-10">
                        <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                            <FaRegStar className="text-2xl text-yellow-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Starred Devices</h1>
                            <p className="text-slate-500 text-sm">Quick access to your most used remote machines.</p>
                        </div>
                    </header>

                    {/* Devices Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {starredDevices.map((device) => {
                            const isOnline = device.status === "Online";
                            return (
                                <div
                                    key={device.id}
                                    className={`group p-6 rounded-[28px] bg-slate-900/40 border border-slate-800 flex flex-col gap-5 transition-all hover:border-indigo-500/50 hover:bg-slate-900/60 ${!isOnline && 'opacity-60 grayscale-[0.5]'}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl text-indigo-400 group-hover:scale-110 transition-transform shadow-inner">
                                            {device.type === 'laptop' ? <FaLaptop /> : <FaDesktop />}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                            <FaCircle size={6} className={isOnline ? 'animate-pulse' : ''} />
                                            {device.status}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">{device.name}</h3>
                                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">ID: 872-990-{device.id}00</p>
                                    </div>

                                    <button
                                        disabled={!isOnline}
                                        onClick={() => handleStartSession(device.id)}
                                        className={`w-full py-3 rounded-xl text-xs font-bold transition-all transform active:scale-95 ${isOnline
                                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {isOnline ? 'Start Remote Session' : 'Device Offline'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}