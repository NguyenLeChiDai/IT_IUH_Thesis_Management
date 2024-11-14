import React from "react";
import { Modal, Button } from "react-bootstrap";
import moment from "moment";
import "../../css/NotificationDetailModal.css";

const NotificationDetailModal = ({
  notification,
  show,
  onHide,
  onMarkAsRead,
}) => {
  if (!notification) return null;

  const handleMarkAsRead = () => {
    onMarkAsRead(notification._id);
    onHide();
  };

  return (
    <Modal
      className="view-notification-detail-modal"
      show={show}
      onHide={onHide}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>{notification.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="notification-detail">
          <p className="notification-message mb-4">{notification.message}</p>
          <div className="notification-meta text-muted">
            <p className="mb-1">
              <strong>Người gửi:</strong> {notification.createdBy?.username}
            </p>
            <p className="mb-1">
              <strong>Thời gian:</strong>{" "}
              {moment(notification.createdAt).format("DD/MM/YYYY HH:mm")}
            </p>
            <p className="mb-1">
              <strong>Trạng thái:</strong>{" "}
              {notification.isRead ? (
                <span className="text-success">Đã đọc</span>
              ) : (
                <span className="text-danger">Chưa đọc</span>
              )}
            </p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        {!notification.isRead && (
          <Button variant="primary" onClick={handleMarkAsRead}>
            Đánh dấu đã đọc
          </Button>
        )}
        <Button variant="secondary" onClick={onHide}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NotificationDetailModal;
