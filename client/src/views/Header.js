import React from "react";
import "../css/Header.css"; // Tạo file CSS để điều chỉnh style của header nếu cần
import logo from "../assets/logo-iuh.jpg";

const Header = () => {
  return (
    <header className="header">
      <div className="logo">
        <img src={logo} alt="Logo" />
      </div>
      <div className="title">
        <h2>Trường Đại Học Công Nghiệp</h2>
        <h2>Thành Phố Hồ Chí Minh</h2>
      </div>
      <div className="right-link">
        <a href="/"> Quay lại trang chủ </a>
      </div>
    </header>
  );
};

export default Header;
