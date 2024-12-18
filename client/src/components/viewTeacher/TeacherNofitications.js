import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import "moment/locale/vi";
import { Table, Button, Modal, Form, Pagination } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import "../../css/AdminNotifications.css";
import io from "socket.io-client";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import { apiUrl, socketUrl } from "../../contexts/constants";

const TeacherNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationsPerPage] = useState(10);
  const [socket, setSocket] = useState(null);

  const groupTypeOptions = [
    { value: "topic", label: "Các nhóm đăng ký đề tài" },
    { value: "review", label: "Nhóm được phân công chấm phản biện" },
    { value: "council", label: "Nhóm được phân công chấm hội đồng" },
    { value: "poster", label: "Nhóm được phân công chấm poster" },
  ];

  useEffect(() => {
    const newSocket = io(`${socketUrl}`, {
      withCredentials: true,
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${apiUrl}/notification/all`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Lỗi khi tải danh sách thông báo");
    }
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}/notification/notification-teacher-group`,
        newNotification,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        setShowCreateModal(false);
        setNewNotification({
          title: "",
          message: "",
        });
        fetchNotifications();
        toast.success("Tạo thông báo mới thành công!");
      }
    } catch (error) {
      console.error("Error creating notification:", error);
      toast.error("Có lỗi xảy ra khi tạo thông báo");
    }
    setLoading(false);
  };

  const handleDeleteNotification = async (id) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa",
      text: "Bạn có chắc chắn muốn xóa thông báo này?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Xác nhận",
      cancelButtonText: "Hủy",
    });
    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`${apiUrl}/notification/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (response.data.success) {
          fetchNotifications();
          toast.success("Xóa thông báo thành công!", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      } catch (error) {
        console.error("Error deleting notification:", error);
        toast.error("Có lỗi xảy ra khi xóa thông báo");
      }
    }
  };

  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastNotification = currentPage * notificationsPerPage;
  const indexOfFirstNotification =
    indexOfLastNotification - notificationsPerPage;
  const currentNotifications = filteredNotifications.slice(
    indexOfFirstNotification,
    indexOfLastNotification
  );

  const totalPages = Math.ceil(
    filteredNotifications.length / notificationsPerPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "all":
        return "Tất cả";
      case "student":
        return "Sinh viên";
      case "teacher":
        return "Giảng viên";
      default:
        return type;
    }
  };

  const getTypeVariant = (type) => {
    switch (type) {
      case "all":
        return "primary";
      case "student":
        return "success";
      case "teacher":
        return "info";
      default:
        return "secondary";
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Thông báo cho nhóm phản biện của bạn</h2>
        <div className="d-flex gap-3">
          <Form.Control
            type="search"
            placeholder="Tìm kiếm thông báo..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Tạo thông báo mới
          </Button>
        </div>
      </div>

      <Table responsive striped bordered hover>
        <thead>
          <tr>
            <th>Tiêu đề</th>
            <th>Nội dung</th>
            <th>Đối tượng</th>
            <th>Thời gian</th>
            <th>Người tạo</th>
            <th>Hoạt động</th>
          </tr>
        </thead>
        <tbody>
          {filteredNotifications.map((notification) => (
            <tr key={notification._id}>
              <td className="title-cell">{notification.title}</td>
              <td className="message-cell">
                {notification.message.length > 300
                  ? `${notification.message.substring(0, 300)}...`
                  : notification.message}
              </td>
              <td>
                <span
                  className={`badge bg-${getTypeVariant(notification.type)}`}
                >
                  {getTypeLabel(notification.type)}
                </span>
              </td>
              <td>
                {moment(notification.createdAt).format("DD/MM/YYYY HH:mm")}
              </td>
              <td>{notification.createdBy?.username || "N/A"}</td>
              <td>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteNotification(notification._id)}
                >
                  <FaTrash />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal
        className="create-notification-modal"
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Tạo thông báo mới</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleCreateNotification}>
            <div className="mb-3">
              <label className="form-label">Tiêu đề</label>
              <input
                type="text"
                className="form-control"
                value={newNotification.title}
                onChange={(e) =>
                  setNewNotification({
                    ...newNotification,
                    title: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Nội dung</label>
              <textarea
                className="form-control"
                rows="4"
                value={newNotification.message}
                onChange={(e) =>
                  setNewNotification({
                    ...newNotification,
                    message: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Loại nhóm sinh viên</label>
              <select
                className="form-select"
                value={newNotification.groupType}
                onChange={(e) =>
                  setNewNotification({
                    ...newNotification,
                    groupType: e.target.value,
                  })
                }
              >
                {groupTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi thông báo"}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default TeacherNotifications;
