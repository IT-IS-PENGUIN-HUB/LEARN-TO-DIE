import { useState } from 'react';
import { KEYS, loadString, saveString } from '../lib/storage.js';
import { IconCloudDown, IconCloudUp, IconGear, IconX } from './icons.jsx';

export default function SettingsModal({ onClose, sync }) {
  const [geminiKey, setGeminiKey] = useState(() => loadString(KEYS.geminiKey));
  const [ghUser, setGhUser] = useState(() => loadString(KEYS.ghUser));
  const [ghRepo, setGhRepo] = useState(() => loadString(KEYS.ghRepo));
  const [ghToken, setGhToken] = useState(() => loadString(KEYS.ghToken));
  const [reminderMin, setReminderMin] = useState(() => loadString(KEYS.reminderMin) || '0');
  const [savedMsg, setSavedMsg] = useState('');

  const saveAll = () => {
    saveString(KEYS.geminiKey, geminiKey.trim());
    // Ô DeepSeek đã bỏ (ロン chỉ dùng Gemini, 14/8) — xoá luôn key cũ còn sót
    // trong máy để ai.js khỏi gọi DeepSeek bằng key rác rồi chờ lỗi mới fallback.
    saveString(KEYS.deepseekKey, '');
    saveString(KEYS.ghUser, ghUser.trim());
    saveString(KEYS.ghRepo, ghRepo.trim());
    saveString(KEYS.ghToken, ghToken.trim());
    saveString(KEYS.reminderMin, reminderMin);
    // Đổi chu kỳ thì cho phép nhắc ngay ở tick kế tiếp
    saveString(KEYS.reminderLast, '0');
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
          <label htmlFor="set-gemini">Gemini API Key (tự điền từ vựng + quét ảnh chụp):</label>
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

        <div className="settings-section">
          <h3>Nhắc từ vựng định kỳ (PC)</h3>
          <p className="settings-note">
            Trong lúc trình duyệt/app còn mở (kể cả thu nhỏ), cứ mỗi chu kỳ sẽ hiện một từ cần ôn ở góc màn
            hình. Cần bấm nút cấp quyền thông báo một lần. (iPhone không hỗ trợ thông báo nền cho web app —
            hãy nhìn badge đỏ trên nút Từ vựng, hoặc dùng Phím tắt iOS.)
          </p>
          <label htmlFor="set-reminder">Chu kỳ nhắc:</label>
          <select
            id="set-reminder"
            className="dropdown"
            style={{ width: '100%', marginBottom: '0.75rem' }}
            value={reminderMin}
            onChange={(e) => setReminderMin(e.target.value)}
          >
            <option value="0">Tắt</option>
            <option value="5">Mỗi 5 phút</option>
            <option value="10">Mỗi 10 phút</option>
            <option value="20">Mỗi 20 phút</option>
            <option value="30">Mỗi 30 phút</option>
            <option value="60">Mỗi 1 giờ</option>
          </select>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            style={{ width: '100%' }}
            onClick={async () => {
              if (typeof Notification === 'undefined') {
                setSavedMsg('Trình duyệt này không hỗ trợ thông báo.');
                return;
              }
              const perm = await Notification.requestPermission();
              setSavedMsg(perm === 'granted' ? 'Đã cấp quyền thông báo ✓ (nhớ chọn chu kỳ rồi Lưu)' : 'Bạn đã từ chối quyền thông báo.');
            }}
          >
            🔔 Cấp quyền thông báo
          </button>
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
