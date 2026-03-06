import React, { useState } from 'react';
import { contactsApi } from '../services/contacts.api.js';

export default function SaveContactModal({ contact, onClose, onSaved }) {
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get token from localStorage or context
      const token = localStorage.getItem('vd_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      await contactsApi.save(token, {
        phone: contact.phone,
        fullName: fullName.trim()
      });

      onSaved({
        ...contact,
        fullName: fullName.trim(),
        saved: true
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-xl p-6 w-96 max-w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Save Contact</h3>
        
        <div className="mb-4">
          <p className="text-sm text-slate-400 mb-2">Phone number:</p>
          <p className="text-white font-medium">{contact.phone}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Contact Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter contact name"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-lg p-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
