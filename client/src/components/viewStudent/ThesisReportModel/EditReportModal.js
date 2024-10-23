import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { Upload } from "lucide-react";

const EditReportModal = ({ show, onHide, report, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [currentFileName, setCurrentFileName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (report) {
      setTitle(report.title || "");
      setDescription(report.description || "");
      setCurrentFileName(report.fileName || "");
    }
  }, [report]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    const allowedTypes = [".doc", ".docx", ".xls", ".xlsx"];
    const fileExtension = selectedFile.name
      .toLowerCase()
      .substring(selectedFile.name.lastIndexOf("."));

    if (!allowedTypes.includes(fileExtension)) {
      setError("Chỉ chấp nhận file Word hoặc Excel");
      setFile(null);
      e.target.value = null;
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      // 5MB
      setError("Kích thước file không được vượt quá 5MB");
      setFile(null);
      e.target.value = null;
      return;
    }

    setError("");
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề báo cáo");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (file) {
      formData.append("file", file);
    }

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      setError("Có lỗi xảy ra khi cập nhật báo cáo");
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setError("");
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Chỉnh sửa báo cáo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>
              Tiêu đề báo cáo <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>File đính kèm hiện tại</Form.Label>
            <p className="text-muted">{currentFileName}</p>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tải lên file mới (không bắt buộc)</Form.Label>
            <Form.Control
              type="file"
              onChange={handleFileChange}
              accept=".doc,.docx,.xls,.xlsx"
            />
            <Form.Text className="text-muted">
              Chấp nhận file Word hoặc Excel, kích thước tối đa 5MB
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Hủy
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          <Upload size={16} className="me-1" />
          Cập nhật
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditReportModal;
