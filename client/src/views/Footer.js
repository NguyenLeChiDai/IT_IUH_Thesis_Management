import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faBuilding,
  faPhoneAlt,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import "../css/Footer.css";
import logo from "../assets/iuh_logo1024x577.png"; // Đường dẫn tới ảnh logo

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo">
          <img src={logo} alt="Logo IUH" className="footer-logo-img" />
          Đại học Công nghiệp TP.HCM
        </div>
        <div className="footer-info">
          <p>
            <FontAwesomeIcon icon={faMapMarkerAlt} className="icon" />
            12 Nguyễn Văn Bảo, Q. Gò Vấp, TP. Hồ Chí Minh
          </p>
          <p>
            <FontAwesomeIcon icon={faBuilding} className="icon" />
            Khoa Công nghệ Thông tin - Lầu 1 - Nhà H
          </p>
          <p>
            <FontAwesomeIcon icon={faPhoneAlt} className="icon" />
            Điện thoại: 028. 389.40390 - 167
          </p>
          <p>
            <FontAwesomeIcon icon={faEnvelope} className="icon" />
            Email:{" "}
            <a href="mailto:daotao.fit@iuh.edu.vn">daotao.fit@iuh.edu.vn</a>
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          © 2023 Trường Đại Học Công Nghiệp TP.HCM. Tất cả quyền được bảo lưu.
        </p>
        {/* <p>Phát triển bởi: Nguyễn Lê Chí Đại & Phạm Minh Hiếu</p> */}
      </div>
    </footer>
  );
};

export default Footer;
