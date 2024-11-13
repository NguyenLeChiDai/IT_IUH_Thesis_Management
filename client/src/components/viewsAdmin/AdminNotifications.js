// AdminNotifications.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import "moment/locale/vi";
import { Table, Button, Modal } from "react-bootstrap";
import "../../css/AdminNotifications.css";

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "all",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/notification",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/notification",
        newNotification,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.data.success) {
        setShowCreateModal(false);
        setNewNotification({ title: "", message: "", type: "all" });
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error creating notification:", error);
      alert("Có lỗi xảy ra khi tạo thông báo");
    }
    setLoading(false);
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
        <h2>Quản lý thông báo</h2>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          Tạo thông báo mới
        </Button>
      </div>

      <Table responsive striped bordered hover>
        <thead>
          <tr>
            <th>Tiêu đề</th>
            <th>Nội dung</th>
            <th>Đối tượng</th>
            <th>Thời gian</th>
            <th>Đã đọc</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((notification) => (
            <tr key={notification._id}>
              <td>{notification.title}</td>
              <td>{notification.message}</td>
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
              <td>{notification.readBy.length} người dùng</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal tạo thông báo */}
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
                rows="3"
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
              <label className="form-label">Gửi đến</label>
              <select
                className="form-select"
                value={newNotification.type}
                onChange={(e) =>
                  setNewNotification({
                    ...newNotification,
                    type: e.target.value,
                  })
                }
              >
                <option value="all">Tất cả</option>
                <option value="student">Sinh viên</option>
                <option value="teacher">Giảng viên</option>
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

export default AdminNotifications;
