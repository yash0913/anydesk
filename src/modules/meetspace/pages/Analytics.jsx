/**
 * Analytics page – shows Agent Install Panel and device info.
 

import React from 'react';
import SidebarShell from '../../chatspace/components/SidebarShell.jsx';
import AgentInstallPanel from '../../desklink/components/AgentInstallPanel.jsx';

export default function Analytics() {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      <SidebarShell />
      <main className="relative flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl" />
        </div>
        <div className="relative z-10 flex h-full flex-col px-6 py-6 sm:px-10 lg:px-14">
          <div className="mb-8">
            <h1 className="text-lg font-semibold text-slate-50 sm:text-xl">Analytics</h1>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
              Device and agent status for remote access.
            </p>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <AgentInstallPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
*/