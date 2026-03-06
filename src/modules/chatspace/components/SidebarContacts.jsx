import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { contactsApi } from '../services/contacts.api.js';
import AddContactModal from './AddContactModal.jsx';
import SaveContactModal from './SaveContactModal.jsx';
import { MessageSquare, Users, Star, Settings, Video, LogOut, Sun, Moon } from 'lucide-react'; // Real Icons

const LAST_CHAT_KEY = 'vd_last_active_chat_phone';

export default function SidebarContacts({ activePhone, onSelectContact, refreshKey = 0, contacts: externalContacts = null }) {
  const { token } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  // Use external contacts if provided, otherwise fetch them
  const displayContacts = externalContacts || contacts;

  useEffect(() => {
    // Only fetch contacts if external contacts are not provided
    if (externalContacts !== null) {
      setContacts(externalContacts);
      return;
    }

    let cancelled = false;
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const data = await contactsApi.list(token);
        if (!cancelled) {
          console.log('[DEBUG] Contacts loaded:', data.contacts);
          // Filter out any contacts with missing user data
          const validContacts = (data.contacts || []).filter(c => c && c.phone);
          if (validContacts.length !== (data.contacts || []).length) {
            console.warn('[DEBUG] Some contacts have missing user data:', {
              total: data.contacts?.length || 0,
              valid: validContacts.length,
              invalid: (data.contacts || []).length - validContacts.length
            });
          }
          setContacts(validContacts);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load contacts');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token, refreshKey, externalContacts]);

  useEffect(() => {
    if (!activePhone) {
      const last = localStorage.getItem(LAST_CHAT_KEY);
      if (last && displayContacts.some((c) => {
        // Add null check for c to prevent undefined error
        if (!c || !c.phone) return false;
        return c.phone === last;
      })) {
        onSelectContact(last);
      }
    } else {
      localStorage.setItem(LAST_CHAT_KEY, activePhone);
    }
  }, [activePhone, displayContacts, onSelectContact]);

  const handleAdded = (contact) => {
    setContacts((prev) => [contact, ...prev]);
  };

  const handleSaveContact = (contact) => {
    setSelectedContact(contact);
    setShowSave(true);
  };

  const handleContactSaved = (updatedContact) => {
    setContacts((prev) => 
      prev.map((c) => 
        c.id === updatedContact.id ? updatedContact : c
      )
    );
    setShowSave(false);
    setSelectedContact(null);
  };

  return (
    <section className="w-full md:w-72 border-r border-slate-800 bg-slate-900/80 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-100">Contacts</div>
          <button
            onClick={() => setShowAdd(true)}
            className="w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm flex items-center justify-center"
            title="Add contact"
          >
            +
          </button>
        </div>

        {error && (
          <div className="px-4 py-2 text-xs text-red-400 bg-red-500/10 border-b border-red-500/40">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading && contacts.length === 0 && (
            <div className="px-4 py-3 text-xs text-slate-500">Loading contacts…</div>
          )}

          {displayContacts.map((c) => {
            // Add null check for c to prevent undefined error
            if (!c) {
              return (
                <div key="unknown" className="px-4 py-2 text-xs text-red-400">
                  Invalid contact data
                </div>
              );
            }
            
            const phone = c.phone;
            const isActive = phone === activePhone;
            return (
              <button
                key={c.id}
                onClick={() => onSelectContact(phone)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors border-l-2 ${
                  isActive
                    ? 'bg-slate-800/80 border-indigo-500'
                    : 'border-transparent hover:bg-slate-800/60'
                }`}
              >
                <div className="w-9 h-9 rounded-2xl bg-slate-700 flex items-center justify-center text-xs font-semibold text-white">
                  {c.fullName
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <div className="text-slate-100 text-sm truncate">{c.fullName}</div>
                    {c.saved === false && (
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[9px] text-slate-400 uppercase">
                        unsaved
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-2">
                    {c.phone}
                    {c.saved === false && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveContact(c);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 text-xs underline"
                        title="Save contact"
                      >
                        Save
                      </button>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
      </div>

      {showAdd && (
        <AddContactModal onClose={() => setShowAdd(false)} onAdded={handleAdded} />
      )}
      
      {showSave && selectedContact && (
        <SaveContactModal 
          contact={selectedContact} 
          onClose={() => setShowSave(false)} 
          onSaved={handleContactSaved}
        />
      )}
    </section>
  );
}
