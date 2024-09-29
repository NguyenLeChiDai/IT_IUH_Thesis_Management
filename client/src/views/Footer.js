import React from "react";
import "../css/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">Đại học Công nghiệp TP.HCM</div>
        <div className="footer-links">
          <a href="#">Trang chủ</a>
          <a href="#">Giới thiệu</a>
          <a href="#">Liên hệ</a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          © 2023 Trường Đại Học Công Nghiệp TP.HCM. Tất cả quyền được bảo lưu.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
