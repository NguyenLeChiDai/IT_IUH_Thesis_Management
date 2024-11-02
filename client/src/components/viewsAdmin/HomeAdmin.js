import React from "react";
import {
  FaBook,
  FaUsers,
  FaUserGraduate,
  FaFileAlt,
  FaBell,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/HomeAdmin.css";

const HomeAdmin = () => {
  const stats = [
    {
      title: "Tổng số đề tài",
      value: "156",
      icon: <FaBook className="stats-icon" />,
      description: "Đã phê duyệt: 120",
      color: "primary",
    },
    {
      title: "Sinh viên đăng ký",
      value: "324",
      icon: <FaUsers className="stats-icon" />,
      description: "Đã có nhóm: 300",
      color: "success",
    },
    {
      title: "Giảng viên",
      value: "45",
      icon: <FaUserGraduate className="stats-icon" />,
      description: "Đang hướng dẫn: 38",
      color: "info",
    },
    {
      title: "Khóa luận đã nộp",
      value: "98",
      icon: <FaFileAlt className="stats-icon" />,
      description: "Đã chấm điểm: 85",
      color: "warning",
    },
  ];

  const recentActivities = [
    "GV. Nguyễn Văn A đã phê duyệt đề tài 'Ứng dụng AI trong nhận diện khuôn mặt'",
    "Nhóm SV03 đã nộp báo cáo tiến độ tuần 8",
    "GV. Trần Thị B đã đăng ký hướng dẫn thêm 2 nhóm sinh viên",
    "Admin đã phê duyệt 15 đề tài mới",
    "Hệ thống đã gửi mail nhắc nhở nộp báo cáo cho 25 nhóm",
  ];

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1
          className="h3 mb-0"
          style={{ color: "#194d82", fontWeight: "bold" }}
        >
          Hệ thống Quản lý Khóa luận - ĐH Công nghiệp TP.HCM
        </h1>
        <div className="d-flex align-items-center text-muted">
          <FaBell className="me-2" />
          <small>Cập nhật lúc: {new Date().toLocaleString()}</small>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {stats.map((stat, index) => (
          <div key={index} className="col-12 col-md-6 col-lg-3">
            <div className={`card border-${stat.color} stat-card h-100`}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div
                    className={`stats-icon-container bg-${stat.color} bg-opacity-10`}
                  >
                    {stat.icon}
                  </div>
                  <h3 className="card-title h2 mb-0">{stat.value}</h3>
                </div>
                <h6 className="card-subtitle mb-2">{stat.title}</h6>
                <p className="card-text text-muted small">{stat.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card h-100">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">
                <FaBell className="me-2" />
                Hoạt động gần đây
              </h5>
            </div>
            <div className="card-body">
              <div className="activity-list">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-dot"></div>
                    <p className="mb-0">{activity}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card h-100">
            <div className="card-header bg-white">
              <h5 className="card-title mb-0">
                <FaFileAlt className="me-2" />
                Thống kê nhanh
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Tỉ lệ sinh viên đã có nhóm</span>
                  <span className="text-success">92.5%</span>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: "92.5%" }}
                    aria-valuenow="92.5"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Tỉ lệ đề tài đã được phê duyệt</span>
                  <span className="text-primary">76.9%</span>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{ width: "76.9%" }}
                    aria-valuenow="76.9"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tỉ lệ khóa luận đã chấm điểm</span>
                  <span className="text-warning">86.7%</span>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-warning"
                    role="progressbar"
                    style={{ width: "86.7%" }}
                    aria-valuenow="86.7"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeAdmin;
