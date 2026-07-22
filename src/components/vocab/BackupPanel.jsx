import { useRef, useState } from 'react';
import { useVocab } from '../../context/VocabProvider.jsx';
import { SUBJECT_IDS } from '../../lib/migrate.js';
import { mergeVocab } from '../../services/github.js';
import { IconCloudDown, IconCloudUp, IconDownload, IconUpload } from '../icons.jsx';

export default function BackupPanel({ sync }) {
  const { vocab, replaceAll } = useVocab();
  const fileInputRef = useRef(null);
  const [fileMsg, setFileMsg] = useState(null); // {ok, text}

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(vocab, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    a.href = URL.createObjectURL(blob);
    a.download = `vocab_backup_${stamp}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const looksValid = Array.isArray(parsed) || SUBJECT_IDS.some((s) => Array.isArray(parsed?.[s]));
      if (!looksValid) throw new Error('File không đúng định dạng vocab.');
      // Gộp thay vì ghi đè: không mất từ mới thêm trên máy này
      replaceAll(mergeVocab(vocab, parsed));
      setFileMsg({ ok: true, text: 'Đã nhập và gộp dữ liệu từ file ✓' });
    } catch (err) {
      setFileMsg({ ok: false, text: `Không nhập được: ${err.message}` });
    }
  };

  const status = sync?.status;

  return (
    <div className="backup-section">
      <div className="backup-row">
        <span className="backup-label">☁️ Đồng bộ GitHub:</span>
        <div className="backup-actions">
          <button type="button" className="btn btn-xs btn-info" onClick={() => sync.doPull()}>
            <IconCloudDown /> Tải về
          </button>
          <button type="button" className="btn btn-xs btn-success" onClick={() => sync.doPush()}>
            <IconCloudUp /> Lưu lên
          </button>
        </div>
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
      <div className="backup-row">
        <span className="backup-label">📁 File dự phòng:</span>
        <div className="backup-actions">
          <button type="button" className="btn btn-xs btn-outline" onClick={exportFile}>
            <IconDownload /> Xuất file
          </button>
          <button type="button" className="btn btn-xs btn-outline" onClick={() => fileInputRef.current?.click()}>
            <IconUpload /> Nhập file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={importFile}
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      </div>
      {fileMsg && (
        <p className={`form-msg ${fileMsg.ok ? 'ok' : 'err'}`} role="status">
          {fileMsg.text}
        </p>
      )}
    </div>
  );
}
