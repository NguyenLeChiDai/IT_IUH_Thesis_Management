import React, { useEffect, useState } from "react";
import {
  FaBook,
  FaUsers,
  FaUserGraduate,
  FaFileAlt,
  FaBell,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/HomeAdmin.css";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { apiUrl } from "../../contexts/constants";

const StatisticsTeacher = () => {
  //ĐẾM TỔNG SỐ ĐỀ TÀI
  const [teacherTopicStats, setTeacherTopicStats] = useState({
    totalTopics: 0,
    approvedTopics: 0,
    approvedPercentage: 0,
    totalGroupsRegistered: 0,
  });

  useEffect(() => {
    const fetchTeacherTopicStats = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/teacherStatistics/teacher-topic-statistics`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setTeacherTopicStats(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thống kê đề tài:", error);
      }
    };

    fetchTeacherTopicStats();
  }, []);

  //THỐNG KÊ NHÓM PHỤ TRÁCH VÀ NHÓM ĐÃ CHẤM ĐIỂM CHO GIẢNG VIÊN

  const [groupStats, setGroupStats] = useState({
    totalGroups: 0,
    completedGroups: 0,
    completedPercentage: 0,
  });

  useEffect(() => {
    const fetchGroupStatistics = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/teacherStatistics/teacher-group-statistics`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setGroupStats(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thống kê nhóm:", error);
      }
    };

    fetchGroupStatistics();
  }, []);

  //THỐNG KÊ CHẤM PHẢN BIỆN
  const [reviewAssignmentStats, setReviewAssignmentStats] = useState({
    totalReviewGroups: 0,
    completedReviewGroups: 0,
    completedPercentage: 0,
  });
  // Thêm useEffect để fetch dữ liệu
  useEffect(() => {
    const fetchReviewAssignmentStats = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/teacherStatistics/review-assignment-statistics`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setReviewAssignmentStats(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thống kê phân công chấm phản biện:", error);
      }
    };

    fetchReviewAssignmentStats();
  }, []);

  //PHÂN CÔNG CHẤM HỘI ĐỒNG
  const [councilAssignmentStats, setCouncilAssignmentStats] = useState({
    totalCouncilGroups: 0,
    completedCouncilGroups: 0,
    completedPercentage: 0,
  });
  useEffect(() => {
    const fetchCouncilAssignmentStats = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/teacherStatistics/council-assignment-statistics`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setCouncilAssignmentStats(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thống kê phân công chấm hội đồng:", error);
      }
    };

    fetchCouncilAssignmentStats();
  }, []);

  //THỐNG KÊ CHẤM POSTER
  const [posterAssignmentStats, setPosterAssignmentStats] = useState({
    totalPosterGroups: 0,
    completedPosterGroups: 0,
    completedPercentage: 0,
  });

  useEffect(() => {
    const fetchPosterAssignmentStats = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/teacherStatistics/poster-assignment-statistics`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setPosterAssignmentStats(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thống kê phân công chấm poster:", error);
      }
    };

    fetchPosterAssignmentStats();
  }, []);

  //THỐNG KÊ SỐ LƯỢNG BÁO CÁO ĐÃ NỘP VÀ ĐÃ DUYỆT
  const [reportStats, setReportStats] = useState({
    totalReports: 0,
    approvedReports: 0,
    approvedPercentage: 0,
  });

  useEffect(() => {
    const fetchReportStatistics = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/teacherStatistics/teacher-report-statistics`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          setReportStats(response.data.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thống kê báo cáo:", error);
      }
    };

    fetchReportStatistics();
  }, []);

  const stats = [
    {
      title: "Số đề tài đăng ký",
      value: teacherTopicStats.totalTopics,
      description: `Đã phê duyệt: ${teacherTopicStats.approvedTopics}`,
      color: "success",
    },
    {
      title: "Số nhóm phụ trách",
      value: groupStats.totalGroups,
      icon: <FaUsers className="stats-icon" />,
      description: `Đã có điểm: ${groupStats.completedGroups}`,
      color: "success",
      percentage: groupStats.completedPercentage,
    },
    {
      title: "Phân công chấm phản biện",
      value: reviewAssignmentStats.totalReviewGroups,
      icon: <FaUserGraduate className="stats-icon" />,
      description: `Đã chấm phản biện: ${reviewAssignmentStats.completedReviewGroups}`,
      color: "info",
      percentage: reviewAssignmentStats.completedPercentage,
    },
    {
      title: "Phân công chấm hội đồng",
      value: councilAssignmentStats.totalCouncilGroups,
      icon: <FaUsers className="stats-icon" />,
      description: `Đã chấm hội đồng: ${councilAssignmentStats.completedCouncilGroups}`,
      color: "warning",
      percentage: councilAssignmentStats.completedPercentage,
    },
    {
      title: "Phân công chấm poster",
      value: posterAssignmentStats.totalPosterGroups,
      icon: <FaFileAlt className="stats-icon" />,
      description: `Đã chấm poster: ${posterAssignmentStats.completedPosterGroups}`,
      color: "warning",
      percentage: posterAssignmentStats.completedPercentage,
    },
    {
      title: "Báo cáo đã nhận",
      value: reportStats.totalReports,
      icon: <FaFileAlt className="stats-icon" />,
      description: `Đã duyệt: ${reportStats.approvedReports}`,
      color: "warning",
      percentage: reportStats.approvedPercentage,
    },
  ];

  //HOẠT ĐỘNG GẦN ĐÂY
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

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
    // Cập nhật mỗi 30 giây
    const interval = setInterval(fetchActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  //thời gian của hoạt động
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
      default:
        return "Khác";
    }
  };

  //tỉ lệ đề tài được duyệt
  const topicApprovalPercentage = teacherTopicStats.approvedTopics
    ? Math.round(
        (teacherTopicStats.approvedTopics / teacherTopicStats.totalTopics) * 100
      )
    : 0;

  //Tỉ lệ nhóm được chấm điểm
  const groupCompletedPercentage = groupStats.completedPercentage || 0;

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
                <div className="activity-list">
                  {activities.map((activity) => (
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
                  <span>Tỉ lệ đề tài đã được phê duyệt</span>
                  <span className="text-primary">
                    {topicApprovalPercentage}%
                  </span>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{ width: `${topicApprovalPercentage}%` }}
                    aria-valuenow={topicApprovalPercentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>

              {/* <div className="mb-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Tỉ lệ đề tài đã được phê duyệt</span>
                  <span className="text-primary">20%</span>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{ width: "20%" }}
                    aria-valuenow="20%"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div> */}

              <div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tỉ lệ khóa luận đã chấm điểm</span>
                  <span className="text-warning">
                    {groupCompletedPercentage}%
                  </span>
                </div>
                <div className="progress">
                  <div
                    className="progress-bar bg-warning"
                    role="progressbar"
                    style={{ width: `${groupCompletedPercentage}%` }}
                    aria-valuenow={groupCompletedPercentage}
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

export default StatisticsTeacher;
