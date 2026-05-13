"use client";

import React, { useState } from "react";
import Modal from "./Modal";

type FontSize = 'small' | 'medium' | 'large';

export default function SettingsModal({
  open,
  onClose,
  enterToSend: initialEnterToSend = true,
  fontSize: initialFontSize = 'medium',
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  enterToSend?: boolean;
  fontSize?: FontSize;
  onSave?: (s: { enterToSend: boolean; fontSize: FontSize }) => void;
}) {
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(false);
  const [enterToSend, setEnterToSend] = useState(initialEnterToSend);
  const [fontSize, setFontSize] = useState<FontSize>(initialFontSize);

  const handleSave = () => {
    onSave?.({ enterToSend, fontSize });
    onClose();
  };

  function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors ${value ? "bg-purple-600" : "bg-gray-600"}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${value ? "translate-x-6" : ""}`} />
      </button>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-5">

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Notifications</label>
          <Toggle value={notifications} onChange={setNotifications} />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Message Sounds</label>
          <Toggle value={sounds} onChange={setSounds} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-300">Enter to send</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {enterToSend ? "Enter sends, Shift+Enter adds new line" : "Shift+Enter sends, Enter adds new line"}
            </div>
          </div>
          <Toggle value={enterToSend} onChange={setEnterToSend} />
        </div>

        <div>
          <div className="text-sm font-medium text-gray-300 mb-2">Message font size</div>
          <div className="flex gap-2">
            {(['small', 'medium', 'large'] as FontSize[]).map(size => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`flex-1 py-1.5 rounded-lg border text-sm capitalize transition-colors
                  ${fontSize === size
                    ? 'border-purple-500 bg-purple-700/30 text-purple-300'
                    : 'border-[#303048] bg-[#1e1e2a] text-gray-400 hover:border-purple-500/50'}`}
              >
                <span className={{ small: 'text-xs', medium: 'text-sm', large: 'text-base' }[size]}>
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-[#3a3a3a]">
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-4 py-2 transition font-medium">
            Cancel
          </button>
          <button onClick={handleSave} className="bg-purple-700 hover:bg-purple-600 text-white rounded-lg px-4 py-2 transition font-medium">
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
