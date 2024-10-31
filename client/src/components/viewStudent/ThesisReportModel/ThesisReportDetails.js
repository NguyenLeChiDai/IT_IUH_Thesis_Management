import React, { useState, useEffect } from "react";
import { Button, Table, Card, Badge } from "react-bootstrap";
import {
  Calendar,
  Download,
  Upload,
  Eye,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import SubmitReportModal from "../ThesisReportModel/SubmitReportModal";
import ViewReportModal from "../ThesisReportModel/ViewReportModal";
import EditReportModal from "../ThesisReportModel/EditReportModal";
import Swal from "sweetalert2";

const ThesisReportDetails = ({
  selectedFolder,
  onBack,
  folderSubmissionStatus,
  setFolderSubmissionStatus,
}) => {
  const [reports, setReports] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (selectedFolder) {
      fetchFolderReports(selectedFolder._id);
    }
  }, [selectedFolder]);

  const fetchFolderReports = async (folderId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/thesisReports/get-folder-reports/${folderId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        setReports(response.data.reports);
        setFolderSubmissionStatus((prevStatus) => ({
          ...prevStatus,
          [folderId]: response.data.reports.length > 0,
        }));
      } else {
        toast.error(response.data.message || "Không thể lấy danh sách báo cáo");
      }
    } catch (error) {
      console.error("Error fetching folder reports:", error);
      toast.error("Lỗi khi lấy danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (formData) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/thesisReports/submit-report/${selectedFolder._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setShowModal(false);
        setFolderSubmissionStatus((prevStatus) => ({
          ...prevStatus,
          [selectedFolder._id]: true,
        }));
        fetchFolderReports(selectedFolder._id);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error(error.response?.data?.message || "Lỗi khi nộp báo cáo");
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowViewModal(true);
  };

  const handleEditReport = () => {
    setShowViewModal(false);
    setShowEditModal(true);
  };

  const handleUpdateReport = async (formData) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/thesisReports/${selectedReport._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        toast.success("Cập nhật báo cáo thành công");
        setShowEditModal(false);
        fetchFolderReports(selectedFolder._id);
      }
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật báo cáo");
    }
  };

  const handleDeleteReport = async (report) => {
    const isConfirmed = await Swal.fire({
      title: "Xác Nhận Xóa Báo Cáo",
      html: `
        <div>
          <p>Bạn có chắc chắn muốn xóa báo cáo sau?</p>
          <strong>Tên báo cáo:</strong> ${report.title}<br/>
          <strong>Ngày nộp:</strong> ${new Date(
            report.submissionDate
          ).toLocaleString()}
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Có, xóa báo cáo!",
      cancelButtonText: "Hủy bỏ",
      reverseButtons: true,
      customClass: {
        popup: "my-custom-popup-class",
        title: "my-custom-title-class",
        content: "my-custom-content-class",
      },
    });

    if (isConfirmed.isConfirmed) {
      try {
        await axios.delete(
          `http://localhost:5000/api/thesisReports/${report._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const updatedReports = reports.filter((r) => r._id !== report._id);
        setReports(updatedReports);

        setFolderSubmissionStatus((prevStatus) => ({
          ...prevStatus,
          [selectedFolder._id]: updatedReports.length > 0,
        }));

        toast.success("Xóa báo cáo thành công");
      } catch (error) {
        console.error("Error deleting report:", error);
        toast.error(error.response?.data?.message || "Lỗi khi xóa báo cáo");
      }
    }
  };

  const handleDownloadFile = async (fileUrl, fileName) => {
    if (fileUrl) {
      try {
        const filename = fileUrl.split("/").pop();
        const response = await axios.get(
          `http://localhost:5000/api/thesisReports/download/${filename}`,
          {
            responseType: "blob",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (error) {
        console.error("Error downloading file:", error);
        if (error.response && error.response.status === 404) {
          toast.error("File không tồn tại hoặc đã bị xóa.");
        } else {
          toast.error("Không thể tải xuống file. Vui lòng thử lại sau.");
        }
      }
    } else {
      toast.error("Không thể tải xuống file. URL không hợp lệ.");
    }
  };

  const renderReportStatus = (report) => {
    return (
      <div>
        <span
          className={`status-badge ${
            report.status === "GV Đã xem" ? "reviewed" : "pending"
          }`}
        >
          {report.status}
        </span>
        {report.isLate && (
          <div className="text-danger mt-1">
            <small>Nộp muộn ({report.lateTime})</small>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <Button variant="outline-secondary" onClick={onBack} className="mb-3">
        <ArrowLeft size={16} className="me-2" /> Quay lại
      </Button>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Tên thư mục: {selectedFolder.name}</Card.Title>
          <Card.Text>Mô tả: {selectedFolder.description}</Card.Text>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Calendar size={16} className="me-2" />
              Hạn nộp: {new Date(selectedFolder.deadline).toLocaleString()}
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setSelectedReport(null);
                setEditMode(false);
                setShowModal(true);
              }}
            >
              <Upload size={16} className="me-2" />
              Nộp báo cáo
            </Button>
          </div>
        </Card.Body>
      </Card>

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên báo cáo</th>
              <th>Ngày đăng</th>
              <th style={{ minWidth: "150px" }}>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report, index) => (
              <tr key={report._id}>
                <td>{index + 1}</td>
                <td className="title-cell">{report.title}</td>
                <td>{new Date(report.submissionDate).toLocaleString()}</td>
                <td>{renderReportStatus(report)}</td>
                <td>
                  <Button
                    variant="info"
                    size="sm"
                    className="me-2"
                    onClick={() => handleViewReport(report)}
                  >
                    <Eye size={16} className="me-1" /> Xem
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="me-2"
                    onClick={() =>
                      handleDownloadFile(report.fileUrl, report.fileName)
                    }
                  >
                    <Download size={16} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteReport(report)}
                  >
                    <Trash2 size={16} className="me-1" /> Xóa
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <SubmitReportModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSubmit={handleSubmitReport}
        editMode={editMode}
        selectedReport={selectedReport}
      />

      <ViewReportModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        report={selectedReport}
        onEdit={handleEditReport}
        onDownload={handleDownloadFile}
      />

      <EditReportModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        report={selectedReport}
        onSubmit={handleUpdateReport}
      />
    </div>
  );
};

export default ThesisReportDetails;
