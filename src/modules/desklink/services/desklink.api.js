const API_BASE = import.meta.env.VITE_API_BASE || 'https://anydesk.onrender.com/api';



const parseJSON = async (res) => {

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {

    const message = data?.message || 'Request failed';

    const error = new Error(message);

    error.status = res.status;

    throw error;

  }

  return data;

};



export const desklinkApi = {

  async registerDevice(token, payload) {

    const res = await fetch(`${API_BASE}/device/register`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        Authorization: `Bearer ${token}`,

      },

      body: JSON.stringify(payload),

    });

    return parseJSON(res);

  },



  async getUserAgentStatus(token, userId, meetingId) {

    const url = new URL(`${API_BASE}/device/user/${encodeURIComponent(userId)}/agent-status`);

    if (meetingId) url.searchParams.set('meetingId', String(meetingId));

    const res = await fetch(url.toString(), {

      headers: {

        Authorization: `Bearer ${token}`,

      },

    });

    return parseJSON(res);

  },



  async listContacts(token) {

    const res = await fetch(`${API_BASE}/contact-links`, {

      headers: {

        Authorization: `Bearer ${token}`,

      },

    });

    return parseJSON(res);

  },



  async requestRemote(token, payload) {

    const res = await fetch(`${API_BASE}/remote/request`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        Authorization: `Bearer ${token}`,

      },

      body: JSON.stringify(payload),

    });

    return parseJSON(res);

  },



  // In-meeting remote access: webId-only (toUserId), deviceId resolved server-side

  async requestMeetingRemote(token, targetUserId, senderAuthId) {

    const headers = {

      'Content-Type': 'application/json',

      Authorization: `Bearer ${token}`,

    };



    if (senderAuthId) {

      headers['x-user-id'] = senderAuthId;

    }



    const res = await fetch(`${API_BASE}/remote/meeting-request`, {

      method: 'POST',

      headers,

      body: JSON.stringify({
        toUserId: targetUserId,
        fromMeeting: true  // ✅ Mark this as a meeting session
      }),

    });

    return parseJSON(res);

  },



  async acceptRemote(token, payload) {

    const res = await fetch(`${API_BASE}/remote/accept`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        Authorization: `Bearer ${token}`,

      },

      body: JSON.stringify(payload),

    });

    return parseJSON(res);

  },



  async rejectRemote(token, payload) {

    const res = await fetch(`${API_BASE}/remote/reject`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        Authorization: `Bearer ${token}`,

      },

      body: JSON.stringify(payload),

    });

    return parseJSON(res);

  },



  async completeRemote(token, payload) {

    const res = await fetch(`${API_BASE}/remote/complete`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json',

        Authorization: `Bearer ${token}`,

      },

      body: JSON.stringify(payload),

    });

    return parseJSON(res);

  },



  async getTurnToken(token) {
    const res = await fetch(`${API_BASE}/remote/turn-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return parseJSON(res);
  },

  async provisionAgentToken(token) {
    const res = await fetch(`${API_BASE}/agent/provision`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return parseJSON(res);
  },
};





