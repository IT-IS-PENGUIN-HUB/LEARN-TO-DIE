import { useState } from 'react';
import { KEYS, loadString, saveString } from '../lib/storage.js';
import { IconCloudDown, IconCloudUp, IconGear, IconX } from './icons.jsx';

export default function SettingsModal({ onClose, sync }) {
  const [geminiKey, setGeminiKey] = useState(() => loadString(KEYS.geminiKey));
  const [deepseekKey, setDeepseekKey] = useState(() => loadString(KEYS.deepseekKey));
  const [ghUser, setGhUser] = useState(() => loadString(KEYS.ghUser));
  const [ghRepo, setGhRepo] = useState(() => loadString(KEYS.ghRepo));
  const [ghToken, setGhToken] = useState(() => loadString(KEYS.ghToken));
  const [savedMsg, setSavedMsg] = useState('');

  const saveAll = () => {
    saveString(KEYS.geminiKey, geminiKey.trim());
    saveString(KEYS.deepseekKey, deepseekKey.trim());
    saveString(KEYS.ghUser, ghUser.trim());
    saveString(KEYS.ghRepo, ghRepo.trim());
    saveString(KEYS.ghToken, ghToken.trim());
    setSavedMsg('Đã lưu cài đặt ✓');
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const status = sync?.status;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Cài đặt" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 450 }}>
        <button type="button" className="close-btn" onClick={onClose} aria-label="Đóng">
          <IconX />
        </button>
        <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <IconGear /> Cài đặt
        </h2>

        <div className="settings-section">
          <h3>AI tự điền từ vựng</h3>
          <label htmlFor="set-deepseek">DeepSeek API Key (ưu tiên):</label>
          <input
            id="set-deepseek"
            type="password"
            className="text-input"
            value={deepseekKey}
            onChange={(e) => setDeepseekKey(e.target.value)}
            placeholder="sk-…"
            autoComplete="off"
          />
          <label htmlFor="set-gemini">Gemini API Key (dự phòng):</label>
          <input
            id="set-gemini"
            type="password"
            className="text-input"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIza…"
            autoComplete="off"
          />
        </div>

        <div className="settings-section">
          <h3>Đồng bộ GitHub</h3>
          <p className="settings-note">
            Đồng bộ từ vựng giữa PC và iPhone. Dùng <strong>fine-grained PAT</strong>: GitHub → Settings →
            Developer settings → Fine-grained tokens → chỉ chọn repo này + quyền <strong>Contents: Read and
            write</strong>. Token chỉ lưu trên máy này, không nằm trong code.
          </p>
          <label htmlFor="set-gh-user">GitHub Username:</label>
          <input
            id="set-gh-user"
            type="text"
            className="text-input"
            value={ghUser}
            onChange={(e) => setGhUser(e.target.value)}
            placeholder="IT-IS-PENGUIN-HUB"
            autoComplete="off"
          />
          <label htmlFor="set-gh-repo">Repository:</label>
          <input
            id="set-gh-repo"
            type="text"
            className="text-input"
            value={ghRepo}
            onChange={(e) => setGhRepo(e.target.value)}
            placeholder="LEARN-TO-DIE"
            autoComplete="off"
          />
          <label htmlFor="set-gh-token">Personal Access Token:</label>
          <input
            id="set-gh-token"
            type="password"
            className="text-input"
            value={ghToken}
            onChange={(e) => setGhToken(e.target.value)}
            placeholder="github_pat_…"
            autoComplete="off"
          />
          <div className="sync-row">
            <button type="button" className="btn btn-sm btn-info" onClick={() => sync.doPull()}>
              <IconCloudDown /> Tải dữ liệu về
            </button>
            <button type="button" className="btn btn-sm btn-success" onClick={() => sync.doPush()}>
              <IconCloudUp /> Lưu dữ liệu lên
            </button>
          </div>
          {status && (
            <p
              className="sync-status"
              role="status"
              style={{ color: status.kind === 'err' ? 'var(--danger)' : status.kind === 'ok' ? 'var(--success)' : 'var(--text-muted)' }}
            >
              {status.text}
            </p>
          )}
        </div>

        <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={saveAll}>
          Lưu tất cả cài đặt
        </button>
        <p className="form-msg ok" role="status">
          {savedMsg}
        </p>
      </div>
    </div>
  );
}
