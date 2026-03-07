import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePresence } from '../../../context/PresenceContext.jsx';
import { Send, Smile, Paperclip, CheckCheck, Check } from 'lucide-react';

// ====================================================================
// 1. MessageBubble Component (with inline timestamp and max-width)
// ====================================================================

// Utility function to determine the status icon and color
const getStatusIndicator = (status) => {
    switch (status) {
        case 'read':
            // Green for read status (standard chat app pattern)
            return <CheckCheck className="w-3.5 h-3.5 text-green-400" />;
        case 'delivered':
            // Lighter indigo for delivered (double check)
            return <CheckCheck className="w-3.5 h-3.5 text-indigo-200/90" />;
        case 'sent':
        default:
            return <Check className="w-3.5 h-3.5 text-indigo-200/90" />;
    }
};

function MessageBubbleComponent({ message, isMe }) {
  // Use a proper timestamp format (assuming message.timestamp is a Date string or similar)
  const time = message.timestamp 
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : '...';

  // Placeholder for message status - assuming these properties exist on the message object
  const messageStatus = isMe ? (message.isRead ? 'read' : message.isDelivered ? 'delivered' : 'sent') : null;
  
  // Ensure enough space at the bottom right for the time/status, preventing overlap
  const timePadding = 'pr-14'; 

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        // Restricted horizontal growth (max-w-[75%]) and relative positioning for timestamp
        className={`max-w-[75%] p-3 text-sm shadow-md transition-all relative ${
          isMe
            // My message: sharp corner bottom-right
            ? 'bg-indigo-600 text-white rounded-t-xl rounded-bl-xl rounded-br-md' 
            // Their message: sharp corner bottom-left
            : 'bg-gray-700 text-gray-100 rounded-t-xl rounded-br-xl rounded-bl-md' 
        }`}
      >
        {/* Message Text Container - with right padding to clear space for the absolute timestamp */}
        <p className={`whitespace-pre-wrap break-words ${timePadding} pb-1`}>
            {message.text}
        </p>
        
        {/* Status and Time Container - ABSOLUTELY positioned inside the bubble */}
        <div 
            className={`absolute bottom-1.5 right-2 text-[10px] flex items-center gap-1 ${
                isMe ? 'text-indigo-200' : 'text-gray-400'
            }`}
        >
            <span className="opacity-80 leading-none">{time}</span>
            
            {/* Conditional Status Indicator */}
            {isMe && messageStatus && getStatusIndicator(messageStatus)}
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// 2. InputBar Component (with lucide icons)
// ====================================================================

function InputBarComponent({ onSend }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line when pressing Enter
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-3 px-5 py-3 border-t border-slate-700 bg-slate-900/95 shadow-lg shadow-black/20"
    >
      
      {/* 1. Emoji Button */}
      <button
        type="button"
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg 
                   text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-colors shrink-0"
        title="Emoji"
      >
         <Smile className="w-5 h-5" />
      </button>

      {/* 2. Attachment Button */}
      <button
        type="button"
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg 
                   text-slate-400 hover:bg-slate-800 hover:text-indigo-400 transition-colors shrink-0"
        title="Attach File"
      >
         <Paperclip className="w-5 h-5" />
      </button>

      {/* 3. Textarea */}
      <div className="flex-1 min-w-0">
        <textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="w-full resize-none bg-slate-800 border border-slate-700 rounded-2xl 
                     px-4 py-3 text-sm text-white placeholder:text-slate-500 
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[44px]"
          style={{ maxHeight: '150px' }} // Prevents text area from growing too large
        />
      </div>
      
      {/* 4. Send Button */}
      <button
        type="submit"
        disabled={!value.trim()}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors shrink-0 ${
            value.trim() 
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white' // Active send button
              : 'bg-slate-700 text-slate-500 cursor-not-allowed' // Disabled send button
        }`}
        title="Send"
      >
         <Send className="w-5 h-5" />
      </button>
    </form>
  );
}

// ====================================================================
// 3. ChatWindow Component (main export)
// ====================================================================

export default function ChatWindowScreen({ activeContact, messages, onSend, currentUser }) {
  const scrollRef = useRef(null);
  const { isUserOnline } = usePresence();

  // Auto-scroll to bottom whenever messages or activeContact change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeContact?.phone]);

  if (!activeContact) {
    return (
      <section className="flex-1 flex items-center justify-center bg-slate-950/80">
        <p className="text-slate-500 text-sm">Select a chat to get started.</p>
      </section>
    );
  }

  const mePhone = useMemo(() => {
      return currentUser && currentUser.countryCode && currentUser.phoneNumber ? `${currentUser.countryCode} ${currentUser.phoneNumber}` : '';
  }, [currentUser]);
  
  // Dynamic presence status
  const isOnline = isUserOnline(activeContact.phone);
  const statusLabel = isOnline ? "Online" : "Offline";
  const statusColor = isOnline ? "bg-emerald-500" : "bg-gray-500";

  return (
    <section className="flex-1 flex flex-col bg-slate-950/80">
      <header className="h-16 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-semibold text-white bg-slate-700"
          >
            {activeContact.fullName
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          {/* Contact Info */}
          <div>
            <div className="text-sm font-medium text-slate-100">{activeContact.fullName}</div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className={`inline-block w-2 h-2 rounded-full ${statusColor}`} />
              <span>{statusLabel}</span>
            </div>
          </div>
        </div>
        {/* Optional: Add call/video buttons here */}
      </header>

      {/* Messages Viewport */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((message, index) => {
            const senderPhone = `${message.senderCountryCode} ${message.senderPhoneNumber}`;
            const isMe = senderPhone === mePhone;
            
            // Pass the improved component
            return <MessageBubbleComponent 
                key={index} 
                message={message} 
                isMe={isMe} 
            />;
        })}
      </div>
      
      {/* Input Bar */}
      <InputBarComponent onSend={onSend} />
    </section>
  );
}