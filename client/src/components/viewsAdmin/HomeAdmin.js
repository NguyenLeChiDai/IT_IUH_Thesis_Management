import React, { useEffect, useState } from "react";
import {
  FaBook,
  FaUsers,
  FaUserGraduate,
  FaFileAlt,
  FaBell,
  FaChevronRight,
  FaChevronLeft,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/HomeAdmin.css";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../contexts/constants";

const HomeAdmin = () => {
  const navigate = useNavigate();
  // đếm số lượng đề tài và đề tài đã được phê duyệt
  const [topicStats, setTopicStats] = useState({
    totalTopics: 0,
    approvedTopics: 0,
  });

  useEffect(() => {
    const fetchTopicStatistics = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/adminStatistics/topic-statistics`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setTopicStats({
            totalTopics: response.data.totalTopics,
            approvedTopics: response.data.approvedTopics,
          });
        }
      } catch (error) {
        console.error("Lỗi lấy thống kê đề tài:", error);
      }
    };

    fetchTopicStatistics();
  }, []);

  // đếm số lượng sinh viên và sinh viên đã có nhóm
  const [studentStats, setStudentStats] = useState({
    totalStudents: 0,
    studentsWithGroup: 0,
    groupedPercentage: 0,
  });

  useEffect(() => {
    const fetchStudentStatistics = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/adminStatistics/student-statistics`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setStudentStats({
            totalStudents: response.data.totalStudents,
            studentsWithGroup: response.data.studentsWithGroup,
            groupedPercentage: response.data.groupedPercentage,
          });
        }
      } catch (error) {
        console.error("Lỗi lấy thống kê sinh viên:", error);
      }
    };

    fetchStudentStatistics();
  }, []);

  // Thông kê giảng viên
  // Thêm state mới cho thống kê giảng viên
  const [teacherStats, setTeacherStats] = useState({
    totalTeachers: 0,
    teachersWithTopics: 0,
  });

  // Thêm state cho thống kê nhóm
  const [groupStats, setGroupStats] = useState({
    groupsWithTopic: 0,
    totalGroups: 0,
    groupsWithTopicPercentage: 0,
  });

  // Thêm useEffect mới để lấy thống kê giảng viên
  useEffect(() => {
    const fetchTeacherStatistics = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/adminStatistics/teacher-statistics`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setTeacherStats({
            totalTeachers: response.data.totalTeachers,
            teachersWithTopics: response.data.teachersWithTopics,
          });
          setGroupStats({
            groupsWithTopic: response.data.groupsWithTopic,
            totalGroups: response.data.totalGroups,
            groupsWithTopicPercentage: response.data.groupsWithTopicPercentage,
          });
        }
      } catch (error) {
        console.error("Lỗi lấy thống kê giảng viên:", error);
      }
    };

    fetchTeacherStatistics();
  }, []);

  // Tính tỉ lệ
  // Thêm state mới cho thống kê nhanh
  const [quickStats, setQuickStats] = useState({
    studentGroupPercentage: 0,
    approvedTopicPercentage: 0,
  });

  // Thêm useEffect mới để lấy thống kê nhanh
  useEffect(() => {
    const fetchQuickStatistics = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/adminStatistics/quick-statistics`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setQuickStats({
            studentGroupPercentage: response.data.studentStats.percentage,
            approvedTopicPercentage: response.data.topicStats.percentage,
          });
        }
      } catch (error) {
        console.error("Lỗi lấy thống kê nhanh:", error);
      }
    };

    fetchQuickStatistics();
  }, []);

  //Thống kê báo cáo
  // Thêm state mới cho thống kê báo cáo
  const [reportStats, setReportStats] = useState({
    totalReports: 0,
    approvedReports: 0,
    approvedPercentage: 0,
  });

  // Thêm useEffect để lấy thống kê báo cáo
  useEffect(() => {
    const fetchReportStatistics = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/adminStatistics/report-statistics`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setReportStats({
            totalReports: response.data.totalReports,
            approvedReports: response.data.approvedReports,
            approvedPercentage: response.data.approvedPercentage,
          });
        }
      } catch (error) {
        console.error("Lỗi lấy thống kê báo cáo:", error);
      }
    };

    fetchReportStatistics();
  }, []);

  const stats = [
    {
      title: "Tổng số đề tài",
      value: topicStats.totalTopics.toString(),
      // ... các thuộc tính khác giữ nguyên
      icon: <FaBook className="stats-icon" />,
      description: `Đã phê duyệt: ${topicStats.approvedTopics}`,
      color: "primary",
      path: "/dashboardAdmin/manage-topics",
    },
    {
      title: "Sinh viên đăng ký",
      value: studentStats.totalStudents.toString(),
      icon: <FaUsers className="stats-icon" />,
      description: `Đã có nhóm: ${studentStats.studentsWithGroup}`,
      color: "success",
      path: "/dashboardAdmin/student-groups",
    },
    {
      title: "Giảng viên",
      value: teacherStats.totalTeachers.toString(),
      icon: <FaUserGraduate className="stats-icon" />,
      description: `Đang hướng dẫn: ${teacherStats.teachersWithTopics}`,
      color: "info",
      path: "/dashboardAdmin/teacher-management",
    },
    {
      title: "Nhóm sinh viên",
      value: groupStats.totalGroups.toString(),
      icon: <FaUsers className="stats-icon" />,
      description: `Đã có đề tài: ${groupStats.groupsWithTopic}`,
      color: "warning",
      path: "/dashboardAdmin/student-groups",
    },
    {
      title: "Khóa luận đã nộp",
      value: reportStats.totalReports.toString(),
      icon: <FaFileAlt className="stats-icon" />,
      description: `Đã chấm điểm: ${reportStats.approvedReports}`,
      color: "warning",
      path: "/dashboardAdmin/AdminReportList",
    },
  ];

  //HOẠT ĐỘNG GẦN ĐÂY
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const activitiesPerPage = 5;

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get(`${apiUrl}/adminStatistics/recent`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          setActivities(response.data.activities);
        }
      } catch (error) {
        console.error("Lỗi khi lấy hoạt động:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    // Cập nhật mỗi 10 giây
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, []);

  // Tính toán phân trang
  const indexOfLastActivity = currentPage * activitiesPerPage;
  const indexOfFirstActivity = indexOfLastActivity - activitiesPerPage;
  const currentActivities = activities.slice(
    indexOfFirstActivity,
    indexOfLastActivity
  );

  // Chuyển trang
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Render phân trang
  const renderPagination = () => {
    const pageNumbers = [];
    for (
      let i = 1;
      i <= Math.ceil(activities.length / activitiesPerPage);
      i++
    ) {
      pageNumbers.push(i);
    }

    return (
      <nav>
        <ul className="pagination justify-content-center mt-3">
          <li
            className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
            onClick={() => currentPage > 1 && paginate(currentPage - 1)}
          >
            <span className="page-link">
              <FaChevronLeft />
            </span>
          </li>
          {pageNumbers.map((number) => (
            <li
              key={number}
              className={`page-item ${currentPage === number ? "active" : ""}`}
            >
              <span onClick={() => paginate(number)} className="page-link">
                {number}
              </span>
            </li>
          ))}
          <li
            className={`page-item ${
              currentPage === pageNumbers.length ? "disabled" : ""
            }`}
            onClick={() =>
              currentPage < pageNumbers.length && paginate(currentPage + 1)
            }
          >
            <span className="page-link">
              <FaChevronRight />
            </span>
          </li>
        </ul>
      </nav>
    );
  };

  //THỜI GIANG HOẠT ĐỘNG
  const formatTime = (date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now - activityDate) / (1000 * 60));

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return activityDate.toLocaleDateString("vi-VN");
  };
  // Hàm helper để xác định màu badge dựa trên loại hoạt động
  const getActivityBadgeColor = (type) => {
    switch (type) {
      case "TOPIC_APPROVED":
        return "success";
      case "REPORT_SUBMITTED":
        return "primary";
      case "TEACHER_ASSIGNED":
        return "info";
      case "TOPIC_CREATED":
        return "warning";
      case "GROUP_CREATED":
        return "secondary";
      case "REPORT_SENT_TO_ADMIN": // Thêm case mới
        return "danger"; // Sử dụng màu đỏ để nổi bật
      default:
        return "light";
    }
  };

  // Hàm helper để chuyển đổi tên loại hoạt động
  const getActivityTypeName = (type) => {
    switch (type) {
      case "TOPIC_APPROVED":
        return "Phê duyệt";
      case "REPORT_SUBMITTED":
        return "Nộp báo cáo";
      case "TEACHER_ASSIGNED":
        return "Phân công GV";
      case "TOPIC_CREATED":
        return "Tạo đề tài";
      case "GROUP_CREATED":
        return "Tạo nhóm";
      case "REPORT_SENT_TO_ADMIN": // Thêm case mới
        return "Gửi cho Admin";
      default:
        return "Khác";
    }
  };

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
            <div
              className={`card border-${stat.color} stat-card h-100 ${
                stat.path ? "cursor-pointer hover-shadow" : ""
              }`}
              onClick={() => stat.path && navigate(stat.path)}
              style={{
                cursor: stat.path ? "pointer" : "default",
                transition: "all 0.3s ease",
              }}
            >
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
      {/* HOẠT ĐỘNG GẦN ĐÂY */}
      {/* HOẠT ĐỘNG GẦN ĐÂY */}
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
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Đang tải...</span>
                  </div>
                </div>
              ) : activities.length === 0 ? (
                <p className="text-center text-muted">Chưa có hoạt động nào</p>
              ) : (
                <>
                  <div className="activity-list">
                    {currentActivities.map((activity) => (
                      <div
                        key={activity._id}
                        className="activity-item d-flex align-items-center mb-3"
                      >
                        <div className="activity-dot"></div>
                        <div className="ms-3 w-100">
                          <p className="mb-0">{activity.description}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                              {formatTime(activity.createdAt)}
                            </small>
                            <span
                              className={`badge bg-${getActivityBadgeColor(
                                activity.type
                              )}`}
                            >
                              {getActivityTypeName(activity.type)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Thêm phân trang */}
                  {activities.length > activitiesPerPage && renderPagination()}
                </>
              )}
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
                  <span className="text-success">
                    {quickStats.studentGroupPercentage}%
                  </span>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${quickStats.studentGroupPercentage}%` }}
                    aria-valuenow={quickStats.studentGroupPercentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Tỉ lệ đề tài đã được phê duyệt</span>
                  <span className="text-primary">
                    {quickStats.approvedTopicPercentage}%
                  </span>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{ width: `${quickStats.approvedTopicPercentage}%` }}
                    aria-valuenow={quickStats.approvedTopicPercentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tỉ lệ khóa luận đã chấm điểm</span>
                  <span className="text-warning">
                    {reportStats.approvedPercentage}%
                  </span>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-warning"
                    role="progressbar"
                    style={{ width: `${reportStats.approvedPercentage}%` }}
                    aria-valuenow={reportStats.approvedPercentage}
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
