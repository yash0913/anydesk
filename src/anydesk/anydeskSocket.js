import { io } from "socket.io-client";

// Use VITE_API_URL if set, otherwise default to the same hostname as the frontend but on port 5000 (standard local dev setup)
const BACKEND_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

export const anydeskSocket = io(BACKEND_URL, {
  path: "/anydesk"
});
