import React, { useState } from 'react';
import { PhoneCall, QrCode, ShieldAlert, CheckCircle2, RefreshCw, Power } from 'lucide-react';

export const SessionsPage: React.FC = () => {
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">WhatsApp Connections</h1>
          <p className="text-xs text-slate-500">
            Manage your workspace WhatsApp Web integration slots with durable session persistence.
          </p>
        </div>
        <button
          onClick={() => setShowQrModal(true)}
          className="flex items-center space-x-2 bg-[#1B548C] hover:bg-[#173F68] text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition"
        >
          <QrCode size={14} />
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
        {/* Session Card 1 */}
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-blue-50 text-[#1B548C]">
                <PhoneCall size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Primary Support Slot #1</h3>
                <p className="text-[11px] text-slate-400">+1 (415) 555-0199</p>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
              <CheckCircle2 size={11} className="mr-1" /> CONNECTED
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
            <button className="flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 px-2.5 py-1.5 rounded transition">
              <RefreshCw size={13} />
              <span>Reconnect</span>
            </button>
            <button className="flex items-center space-x-1 text-xs font-semibold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded transition">
              <Power size={13} />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      </div>

      {/* QR Modal Simulator */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl text-center space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Scan QR Code with WhatsApp</h3>
            <p className="text-xs text-slate-500">
              Open WhatsApp on your phone → Linked Devices → Link a Device.
            </p>
            <div className="bg-slate-100 p-4 rounded-lg inline-block mx-auto border border-slate-200">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=whatshub-auth-demo"
                alt="QR Code"
                className="w-44 h-44 mx-auto"
              />
            </div>
            <div className="flex items-center justify-center space-x-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-500 font-medium">Waiting for QR scan...</span>
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
