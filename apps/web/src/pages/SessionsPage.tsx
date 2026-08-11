import React, { useEffect, useState } from 'react';
import { PhoneCall, QrCode, ShieldAlert, CheckCircle2, RefreshCw, Power, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../services/apiClient';
import { getSocketInstance } from '../services/socketClient';

interface SessionData {
  id: string;
  display_name: string;
  phone_number?: string;
  status: string;
  slot_number: number;
  provider: string;
  qrCodeUrl?: string;
}

export const SessionsPage: React.FC = () => {
  const { currentWorkspace, token } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeQrUrl, setActiveQrUrl] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch initial workspace sessions
  const loadSessions = async () => {
    if (!currentWorkspace || !token) return;
    const res = await fetchApi('/api/whatsapp/sessions', {
      workspaceId: currentWorkspace.id,
      token,
    });
    if (res.success && res.data) {
      setSessions(res.data);
    }
  };

  useEffect(() => {
    loadSessions();

    // Subscribe to Socket.IO events for workspace
    const socket = getSocketInstance();
    if (currentWorkspace) {
      socket.emit('join:workspace', currentWorkspace.id);
    }

    socket.on('session:qr', (data: { sessionId: string; qr: string }) => {
      setActiveQrUrl(data.qr);
      setActiveSessionId(data.sessionId);
    });

    socket.on('session:connected', (data: { sessionId: string; phoneNumber: string }) => {
      setShowQrModal(false);
      setActiveQrUrl(null);
      loadSessions();
    });

    socket.on('session:update', () => {
      loadSessions();
    });

    return () => {
      socket.off('session:qr');
      socket.off('session:connected');
      socket.off('session:update');
    };
  }, [currentWorkspace, token]);

  // Polling fallback when QR modal is active
  useEffect(() => {
    if (!showQrModal || !activeSessionId || !currentWorkspace || !token) return;

    const interval = setInterval(async () => {
      const res = await fetchApi(`/api/whatsapp/sessions/${activeSessionId}/health`, {
        workspaceId: currentWorkspace.id,
        token,
      });

      if (res.success && res.data) {
        if (res.data.qrCodeUrl) {
          setActiveQrUrl(res.data.qrCodeUrl);
        }
        if (res.data.session?.status === 'CONNECTED') {
          setShowQrModal(false);
          setActiveQrUrl(null);
          loadSessions();
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [showQrModal, activeSessionId, currentWorkspace, token]);

  const handleConnectNewSlot = async () => {
    if (!currentWorkspace || !token) return;
    setLoading(true);
    setShowQrModal(true);
    setActiveQrUrl(null);

    const res = await fetchApi('/api/whatsapp/sessions', {
      method: 'POST',
      workspaceId: currentWorkspace.id,
      token,
      body: JSON.stringify({
        display_name: `Support Line #${sessions.length + 1}`,
        provider: 'baileys',
      }),
    });

    setLoading(false);
    if (res.success && res.data) {
      setActiveSessionId(res.data.id);
      if (res.data.qrCodeUrl) {
        setActiveQrUrl(res.data.qrCodeUrl);
      }
      loadSessions();
    }
  };

  const handleDisconnect = async (sessionId: string) => {
    if (!currentWorkspace || !token) return;
    await fetchApi(`/api/whatsapp/sessions/${sessionId}/disconnect`, {
      method: 'POST',
      workspaceId: currentWorkspace.id,
      token,
    });
    loadSessions();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">WhatsApp Connections</h1>
          <p className="text-xs text-slate-500">
            Manage your workspace WhatsApp Web integration slots with durable session persistence.
          </p>
        </div>
        <button
          onClick={handleConnectNewSlot}
          disabled={loading}
          className="flex items-center space-x-2 bg-[#1B548C] hover:bg-[#173F68] text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
          <span>Connect New Slot</span>
        </button>
      </div>

      {/* Compliance Disclaimer */}
      <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-lg flex items-start space-x-3 text-xs text-amber-900">
        <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold mb-0.5">Unofficial WhatsApp Connection Disclaimer</h4>
          <p className="leading-relaxed text-[11px] text-amber-800">
            This connection uses WhatsApp Web through an unofficial integration and is not endorsed by Meta.
            WhatsApp may restrict or suspend accounts that violate its policies. Use WhatsHub only for legitimate
            business communication with recipients who expect or have consented to receive your messages.
          </p>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.length === 0 ? (
          <div className="col-span-2 bg-white border border-[#E2E8F0] p-8 rounded-lg text-center text-slate-500 text-xs">
            No active WhatsApp slots. Click <strong>Connect New Slot</strong> to pair your WhatsApp account.
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-[#1B548C]">
                    <PhoneCall size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{session.display_name}</h3>
                    <p className="text-[11px] text-slate-400">{session.phone_number || 'Slot #' + session.slot_number}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center ${
                    session.status === 'CONNECTED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : session.status === 'QR_REQUIRED'
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <CheckCircle2 size={11} className="mr-1" /> {session.status}
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded text-[11px] space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Provider</span>
                  <span className="font-semibold text-slate-800">Baileys (Unofficial)</span>
                </div>
                <div className="flex justify-between">
                  <span>Durable Storage</span>
                  <span className="font-semibold text-emerald-600">Encrypted (AES-256)</span>
                </div>
                <div className="flex justify-between">
                  <span>Railway Reconnect</span>
                  <span className="font-semibold text-slate-800">Auto-Restore Enabled</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => handleDisconnect(session.id)}
                  className="flex items-center space-x-1 text-xs font-semibold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded transition"
                >
                  <Power size={13} />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Real Authentic QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl text-center space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Scan QR Code with WhatsApp</h3>
            <p className="text-xs text-slate-500">
              Open WhatsApp on your phone → Linked Devices → Link a Device.
            </p>

            <div className="bg-slate-50 p-4 rounded-lg inline-block mx-auto border border-slate-200 min-h-[200px] flex items-center justify-center">
              {activeQrUrl ? (
                <img
                  src={activeQrUrl}
                  alt="Authentic WhatsApp QR Code"
                  className="w-48 h-48 mx-auto rounded border border-slate-300"
                />
              ) : (
                <div className="space-y-2 py-8 text-slate-400">
                  <Loader2 size={32} className="animate-spin mx-auto text-[#1B548C]" />
                  <p className="text-xs font-medium text-slate-600">Connecting to Baileys Engine...</p>
                  <p className="text-[10px] text-slate-400">Generating authentic WhatsApp QR stream</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-500 font-medium">Waiting for WhatsApp phone scan...</span>
            </div>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 rounded-md transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
