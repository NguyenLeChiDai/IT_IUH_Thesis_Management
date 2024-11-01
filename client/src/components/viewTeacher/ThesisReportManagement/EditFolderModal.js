import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import "../../../css/EditFolderModal.css";
const EditFolderModal = ({
  show,
  onHide,
  selectedFolder,
  onUpdate,
  showAlert,
}) => {
  const [loading, setLoading] = useState(false);

  const handleUpdateFolder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.target);
      const folderData = {
        name: formData.get("folderName"),
        description: formData.get("description"),
        deadline: formData.get("deadline"),
        status: formData.get("status"),
      };

      const response = await axios.put(
        `http://localhost:5000/api/reportManagements/folder/${selectedFolder._id}`,
        folderData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        onUpdate(response.data.folder);
        onHide();
        showAlert("Cập nhật thư mục thành công!");
      }
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Lỗi khi cập nhật thư mục",
        "danger"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} className="edit-folder-modal">
      <Modal.Header closeButton>
        <Modal.Title>Chỉnh sửa thư mục</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleUpdateFolder}>
          <Form.Group className="mb-3">
            <Form.Label>Tên thư mục</Form.Label>
            <Form.Control
              type="text"
              name="folderName"
              required
              defaultValue={selectedFolder?.name}
              placeholder="Nhập tên thư mục..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              rows={3}
              defaultValue={selectedFolder?.description}
              placeholder="Nhập mô tả thư mục..."
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Thời hạn nộp</Form.Label>
            <Form.Control
              type="datetime-local"
              name="deadline"
              required
              defaultValue={
                selectedFolder?.deadline
                  ? new Date(selectedFolder.deadline).toISOString().slice(0, 16)
                  : ""
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Trạng thái</Form.Label>
            <Form.Select name="status" defaultValue={selectedFolder?.status}>
              <option value="Đang mở">Đang mở</option>
              <option value="Đã đóng">Đã đóng</option>
            </Form.Select>
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" className="me-2" onClick={onHide}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </div>
        </Form>
      </Modal.Body>

      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}
        >
          <div className="text-white text-center">
            <div className="spinner-border mb-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div>Đang xử lý...</div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EditFolderModal;
