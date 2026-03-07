import React, { useCallback, useEffect, useState } from 'react';
import SidebarContacts from '../components/SidebarContacts.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import SidebarShell from '../components/SidebarShell.jsx';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { messagesApi } from '../services/messages.api.js';
import { contactsApi } from '../services/contacts.api.js';
import { useChatSocket } from '../hooks/useChatSocket.js';
import { usePresence } from '../../../context/PresenceContext.jsx';

export default function Messages() {
  const { user, token } = useAuth();
  const [activePhone, setActivePhone] = useState('');
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]); // New state to store contacts
  const [contactsRefreshKey, setContactsRefreshKey] = useState(0);
  const { registerUser } = usePresence();

  // Register user for presence tracking when component mounts
  useEffect(() => {
    if (user && token) {
      const userPhone = `${user.countryCode} ${user.phoneNumber}`;
      registerUser(user._id, userPhone);
    }
  }, [user, token, registerUser]);

  const handleSocketMessage = useCallback(
    (msg) => {
      const mePhone = `${user.countryCode} ${user.phoneNumber}`;
      const participants = [msg.senderPhone, msg.receiverPhone];
      const involvesMe = participants.includes(mePhone);
      const involvesActive = activePhone ? participants.includes(activePhone) : true;

      if (involvesMe && involvesActive) {
        setMessages((prev) => [...prev, msg]);
        if (msg.receiverPhone === mePhone) {
          setContactsRefreshKey((v) => v + 1);
          // Add unknown sender to contacts list (always, not just when no active phone)
          if (!contacts.find((contact) => contact.phone === msg.senderPhone)) {
            const [countryCode, ...rest] = msg.senderPhone.split(' ');
            const phoneNumber = rest.join(' ');
            const newContact = {
              fullName: msg.senderPhone,
              countryCode,
              phoneNumber,
              phone: msg.senderPhone,
              saved: false,
            };
            setContacts((prev) => [...prev, newContact]);
            
            // Auto-select unknown contact if no active contact
            if (!activePhone) {
              setActivePhone(msg.senderPhone);
              setActiveContact(newContact);
            }
          }
          
          if (!activePhone) {
            setActivePhone(msg.senderPhone);
            const [countryCode, ...rest] = msg.senderPhone.split(' ');
            const phoneNumber = rest.join(' ');
            setActiveContact({
              fullName: msg.senderPhone,
              countryCode,
              phoneNumber,
              phone: msg.senderPhone,
            });
          }
        }
      }
    },
    [activePhone, user, contacts]
  );

  const { sendMessage } = useChatSocket({ token, onMessage: handleSocketMessage });

  // Load saved contacts and merge with unknown contacts
  useEffect(() => {
    const loadContacts = async () => {
      if (!token) return;
      try {
        const data = await contactsApi.list(token);
        const savedContacts = data.contacts || [];
        
        // Merge saved contacts with unknown contacts (from messages)
        const mergedContacts = savedContacts.map(saved => ({
          ...saved,
          saved: true
        }));
        
        setContacts(mergedContacts);
      } catch (err) {
        console.error('Failed to load contacts:', err);
      }
    };
    loadContacts();
  }, [token, contactsRefreshKey]);

  // Function to add new contact to the list
  const addContactToList = (newContact) => {
    setContacts((prev) => {
      const updated = [newContact, ...prev];
      return updated;
    });
  };

  useEffect(() => {
    const loadHistory = async () => {
      if (!token || !activePhone) return;
      try {
        const data = await messagesApi.history(token, activePhone);
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Failed to load history', err);
      }
    };
    loadHistory();
  }, [token, activePhone]);

  const handleSelectContact = (phone) => {
    if (!phone) {
      return;
    }
    
    setActivePhone(phone);
    const [countryCode, ...rest] = phone.split(' ');
    const phoneNumber = rest.join(' ');
    setActiveContact({ fullName: phone, countryCode, phoneNumber, phone });
  };

  const handleSend = (text) => {
    if (!activePhone) return;
    sendMessage(activePhone, text);
  };

  const handleBackFromChat = () => {
    setActiveContact(null);
  };

  return (
    <div className="flex flex-row h-screen overflow-hidden bg-[var(--vd-color-bg)] text-[var(--vd-color-text)] transition-colors duration-500 w-full">
      {/* Global sidebar shell pinned left */}
      <SidebarShell />

      {/* Right content area */}
      <div className="flex-1 flex h-full overflow-hidden">
        {/* Desktop / tablet layout: side-by-side */}
        <div className="hidden md:flex flex-1 h-full overflow-hidden">
          <SidebarContacts
            activePhone={activePhone}
            onSelectContact={handleSelectContact}
            refreshKey={contactsRefreshKey}
            contacts={contacts}
            onAdded={addContactToList}
          />
          <main className="flex-1 flex flex-col h-full overflow-hidden">
            <ChatWindow
              activeContact={activeContact}
              messages={messages}
              onSend={handleSend}
              currentUser={user}
            />
          </main>
        </div>

        {/* Mobile layout: WhatsApp-style toggle to the right of SidebarShell */}
        <div className="flex md:hidden flex-1 h-full overflow-hidden">
          {!activeContact && (
            <div className="flex flex-col h-full w-full overflow-hidden">
              <SidebarContacts
                activePhone={activePhone}
                onSelectContact={handleSelectContact}
                refreshKey={contactsRefreshKey}
                contacts={contacts}
                onAdded={addContactToList}
              />
            </div>
          )}

          {activeContact && (
            <div className="flex flex-col h-full w-full overflow-hidden animate-in fade-in slide-in-from-right-4">
              <ChatWindow
                activeContact={activeContact}
                messages={messages}
                onSend={handleSend}
                currentUser={user}
                onBack={handleBackFromChat}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}