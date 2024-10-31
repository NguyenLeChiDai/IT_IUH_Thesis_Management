import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import "../../../css/SubmitReportModal.css";
import { toast } from "react-toastify";

const SubmitReportModal = ({
  show,
  onHide,
  onSubmit,
  editMode,
  selectedReport,
}) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState(
    editMode && selectedReport ? selectedReport.title : ""
  );
  const [description, setDescription] = useState(
    editMode && selectedReport ? selectedReport.description : ""
  );
  const [titleError, setTitleError] = useState("");

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    if (newTitle.length <= 70) {
      setTitle(newTitle);
      setTitleError("");
    } else {
      setTitleError("Tiêu đề quá dài, chỉ được đặt trong 70 ký tự");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (title.length > 70) {
      return;
    }
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    if (file) {
      formData.append("file", file);
    }
    onSubmit(formData);
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      className="thesis-report-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {editMode ? "Chỉnh sửa báo cáo" : "Nộp báo cáo mới"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Tên báo cáo</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={handleTitleChange}
              maxLength={70}
              isInvalid={!!titleError}
              required
            />
            <Form.Text className="text-muted">
              {title.length}/70 ký tự
            </Form.Text>
            {titleError && (
              <Form.Control.Feedback type="invalid">
                {titleError}
              </Form.Control.Feedback>
            )}
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
            <Form.Label>File báo cáo</Form.Label>
            <Form.Control
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".doc,.docx,.xls,.xlsx"
              required={!editMode}
            />
            {editMode && (
              <Form.Text className="text-muted">
                Để trống nếu không muốn thay đổi file
              </Form.Text>
            )}
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={onHide} className="me-2">
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {editMode ? "Cập nhật" : "Nộp báo cáo"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default SubmitReportModal;
