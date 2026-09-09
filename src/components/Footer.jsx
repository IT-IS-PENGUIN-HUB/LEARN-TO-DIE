export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>"Built for personal learning"</p>
        <div className="footer-meta">
          <span>v2.0.0</span>
          {/* Mã bản dựng — để biết máy đang chạy bản nào khi có gì đó "sửa rồi mà vẫn thế" */}
          <span className="build-id" title="Mã bản dựng">{__BUILD_ID__}</span>
        </div>
      </div>
    </footer>
  );
}
