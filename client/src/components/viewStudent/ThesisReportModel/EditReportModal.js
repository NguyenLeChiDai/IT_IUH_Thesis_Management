import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { Upload } from "lucide-react";
import "../../../css/EditReportModal.css";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

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

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    const allowedTypes = [".doc", ".docx", ".xls", ".xlsx"];
    const fileExtension = selectedFile.name
      .toLowerCase()
      .substring(selectedFile.name.lastIndexOf("."));

    if (!allowedTypes.includes(fileExtension)) {
      toast.error("Chỉ chấp nhận file Word hoặc Excel");
      setFile(null);
      e.target.value = null;
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      // 5MB
      toast.error("Kích thước file không được vượt quá 5MB");
      setFile(null);
      e.target.value = null;
      return;
    }

    // xác nhận file upload
    const isConfirmed = await Swal.fire({
      title: "Xác Nhận Tải File",
      text: `Bạn có chắc chắn muốn tải lên file "${selectedFile.name}" không?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có, tải lên!",
      cancelButtonText: "Không",
    });

    if (isConfirmed.isConfirmed) {
      setFile(selectedFile);
      toast.success("File đã được chọn thành công");
    } else {
      setFile(null);
      e.target.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề báo cáo");
      return;
    }

    // xác nhận update
    const isConfirmed = await Swal.fire({
      title: "Xác Nhận Cập Nhật",
      text: "Bạn có chắc chắn muốn cập nhật báo cáo này không?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có, cập nhật!",
      cancelButtonText: "Không",
    });

    if (isConfirmed.isConfirmed) {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      if (file) {
        formData.append("file", file);
      }

      try {
        await onSubmit(formData);
        // Loại bỏ toast.success ở đây và chuyển logic đóng modal vào hàm onSubmit
        handleClose(true);
      } catch (error) {
        toast.error("Có lỗi xảy ra khi cập nhật báo cáo");
      }
    }
  };

  // Thêm các cấu hình mặc định cho tất cả các SweetAlert
  const defaultSweetAlertConfig = {
    customClass: {
      container: "sweet-alert-container",
      popup: "sweet-alert-popup",
      title: "sweet-alert-title",
      confirmButton: "sweet-alert-confirm-btn",
      cancelButton: "sweet-alert-cancel-btn",
    },
    buttonsStyling: true,
    reverseButtons: true,
    heightAuto: false,
    scrollbarPadding: false,
  };

  // Sửa lại hàm handleClose để nhận tham số skipConfirmation
  const handleClose = async (skipConfirmation = false) => {
    if (!skipConfirmation && (title || description || file)) {
      const isConfirmed = await Swal.fire({
        ...defaultSweetAlertConfig,
        title: "Xác Nhận Đóng",
        text: "Bạn có chắc chắn muốn đóng? Các thay đổi sẽ không được lưu.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Có, đóng!",
        cancelButtonText: "Không",
      });

      if (isConfirmed.isConfirmed) {
        setTitle("");
        setDescription("");
        setFile(null);
        setError("");
        onHide();
      }
    } else {
      setTitle("");
      setDescription("");
      setFile(null);
      setError("");
      onHide();
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="lg"
      className="edit-report-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Chỉnh sửa báo cáo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
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
