import React, { useState, useEffect } from "react";
import { Button, Table, Modal, Form, Card, Badge } from "react-bootstrap";
import {
  Search,
  Calendar,
  FileText,
  Upload,
  Download,
  Folder,
} from "lucide-react";
import { InputAdornment, TextField, TablePagination } from "@mui/material";
import axios from "axios";
import "../../css/ThesisReport.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { toast } from "react-toastify";
import SubmitReportModal from "./ThesisReportModel/SubmitReportModal";
import ViewReportModal from "./ThesisReportModel/ViewReportModal";
import EditReportModal from "./ThesisReportModel/EditReportModal";

const ThesisReport = () => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [reports, setReports] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [file, setFile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFolderDetails, setShowFolderDetails] = useState(false);
  const [folderSubmissionStatus, setFolderSubmissionStatus] = useState({});
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // useEffect để load và cập nhật trạng thái cho tất cả thư mục ngay khi component được mount
  useEffect(() => {
    const initializeFolders = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/thesisReports/student-folders",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          const folders = response.data.folders;
          setFolders(folders);

          // Kiểm tra trạng thái nộp cho tất cả các thư mục
          const submissionStatuses = {};
          for (const folder of folders) {
            const reportsResponse = await axios.get(
              `http://localhost:5000/api/thesisReports/get-folder-reports/${folder._id}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              }
            );

            if (reportsResponse.data.success) {
              submissionStatuses[folder._id] =
                reportsResponse.data.reports.length > 0;
            }
          }
          setFolderSubmissionStatus(submissionStatuses);
        }
      } catch (error) {
        console.error("Error initializing folders:", error);
        toast.error("Lỗi khi tải dữ liệu thư mục");
      } finally {
        setLoading(false);
      }
    };

    initializeFolders();
  }, []); // Chỉ chạy một lần khi component mount

  const fetchFolders = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/thesisReports/student-folders",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.success) {
        setFolders(response.data.folders);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
      toast.error("Lỗi khi lấy danh sách thư mục");
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderReports = async (folderId) => {
    try {
      console.log("Fetching reports for folder:", folderId);
      const response = await axios.get(
        `http://localhost:5000/api/thesisReports/get-folder-reports/${folderId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      console.log("API response:", response.data);
      if (response.data.success) {
        setReports(response.data.reports);
        // Cập nhật trạng thái nộp cho thư mục
        setFolderSubmissionStatus((prevStatus) => ({
          ...prevStatus,
          [folderId]: response.data.reports.length > 0,
        }));
        console.log("Reports set:", response.data.reports);
      } else {
        console.error("API returned success false:", response.data);
        toast.error(response.data.message || "Không thể lấy danh sách báo cáo");
      }
    } catch (error) {
      console.error("Error fetching folder reports:", error.response || error);
      toast.error("Lỗi khi lấy danh sách báo cáo");
    }
  };

  const handleFolderClick = (folder) => {
    setSelectedFolder(folder);
    setShowFolderDetails(true);
    fetchFolderReports(folder._id);
  };

  // Thêm hàm kiểm tra trạng thái nộp cho tất cả các thư mục 1
  const checkFolderSubmissions = async (folders) => {
    try {
      const statuses = {};
      for (const folder of folders) {
        const response = await axios.get(
          `http://localhost:5000/api/thesisReports/get-folder-reports/${folder._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (response.data.success) {
          statuses[folder._id] = response.data.reports.length > 0;
        }
      }
      setFolderSubmissionStatus(statuses);
    } catch (error) {
      console.error("Error checking folder submissions:", error);
    }
  };

  // Cập nhật handleSubmitReport để cập nhật trạng thái nộp sau khi nộp báo cáo thành công
  /* const handleSubmitReport = async (event) => {
    event.preventDefault();
    if (!selectedFolder) {
      toast.error("Vui lòng chọn thư mục để nộp báo cáo");
      return;
    }

    const formData = new FormData();
    formData.append("title", event.target.title.value);
    formData.append("description", event.target.description.value);
    formData.append("file", file);

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
        setFile(null);
        // Cập nhật trạng thái nộp cho thư mục
        setFolderSubmissionStatus((prevStatus) => ({
          ...prevStatus,
          [selectedFolder._id]: true,
        }));
        // Cập nhật danh sách báo cáo
        fetchFolderReports(selectedFolder._id);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error(error.response?.data?.message || "Lỗi khi nộp báo cáo");
    }
  }; */

  const handleSubmitReport = async (formData) => {
    if (!selectedFolder) {
      toast.error("Vui lòng chọn thư mục để nộp báo cáo");
      return;
    }

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
        setFile(null);
        // Cập nhật trạng thái nộp cho thư mục
        setFolderSubmissionStatus((prevStatus) => ({
          ...prevStatus,
          [selectedFolder._id]: true,
        }));
        // Cập nhật danh sách báo cáo
        fetchFolderReports(selectedFolder._id);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error(error.response?.data?.message || "Lỗi khi nộp báo cáo");
    }
  };

  // Cập nhật hàm handleViewReport
  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowViewModal(true); // Sử dụng modal xem chi tiết thay vì modal chung
  };

  // Thêm hàm xử lý chuyển sang chế độ chỉnh sửa
  const handleEditReport = () => {
    setShowViewModal(false);
    setShowEditModal(true);
  };

  // hàm xử lý cập nhật báo cáo
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
        // Cập nhật lại danh sách báo cáo
        fetchFolderReports(selectedFolder._id);
      }
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật báo cáo");
    }
  };

  //  handleDeleteReport để cập nhật trạng thái nộp sau khi xóa báo cáo
  const handleDeleteReport = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa báo cáo này?")) {
      try {
        await axios.delete(`http://localhost:5000/api/thesisReports/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        // Cập nhật danh sách báo cáo
        const updatedReports = reports.filter((report) => report._id !== id);
        setReports(updatedReports);

        // Cập nhật trạng thái nộp cho thư mục hiện tại
        if (selectedFolder) {
          setFolderSubmissionStatus((prevStatus) => ({
            ...prevStatus,
            [selectedFolder._id]: updatedReports.length > 0,
          }));
        }

        toast.success("Xóa báo cáo thành công");
      } catch (error) {
        console.error("Error deleting report:", error);
        toast.error("Lỗi khi xóa báo cáo");
      }
    }
  };

  const handleViewFile = (fileUrl) => {
    if (fileUrl) {
      window.open(fileUrl, "_blank");
    } else {
      toast.error("Không thể mở file. URL không hợp lệ.");
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

  // Filter folders based on search term
  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cập nhật hàm render để hiển thị trạng thái nộp muộn
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
    <div className="thesis-report-container">
      <h2 className="mb-4 text-center">Quản lý báo cáo khóa luận</h2>

      {!showFolderDetails ? (
        <div>
          <div className="mb-4">
            <Form.Control
              type="search"
              placeholder="Tìm kiếm thư mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Table responsive striped bordered hover>
            <thead className="bg-light">
              <tr>
                <th>STT</th>
                <th>Tên thư mục</th>
                <th>Thời hạn nộp</th>
                <th>Trạng thái thư mục</th>
                <th>Trạng thái nộp</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredFolders.map((folder, index) => (
                <tr key={folder._id}>
                  <td>{index + 1}</td>
                  <td>{folder.name}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <Calendar size={16} className="me-2" />
                      {new Date(folder.deadline).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <Badge
                      bg={folder.status === "Đang mở" ? "success" : "secondary"}
                    >
                      {folder.status}
                    </Badge>
                  </td>
                  <td>
                    <Badge
                      bg={
                        folderSubmissionStatus[folder._id]
                          ? "success"
                          : "warning"
                      }
                    >
                      {folderSubmissionStatus[folder._id]
                        ? "Đã nộp"
                        : "Chưa nộp"}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => handleFolderClick(folder)}
                    >
                      <Folder className="me-1" size={16} />
                      Xem chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {(!filteredFolders || filteredFolders.length === 0) && (
            <div className="text-center py-5">
              <FileText size={48} className="text-muted mb-3" />
              <p className="text-muted mb-0">Chưa có thư mục nào được tạo</p>
            </div>
          )}
        </div>
      ) : (
        // Phần hiển thị chi tiết thư mục và danh sách báo cáo (giữ nguyên như cũ)
        <div>
          <Button
            variant="outline-secondary"
            onClick={() => setShowFolderDetails(false)}
            className="mb-3"
          >
            <i className="fas fa-arrow-left"></i> Quay lại
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
                        <i className="fas fa-eye"></i> Xem
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleDownloadFile(report.fileUrl, report.fileName)
                        }
                      >
                        <Download size={16} />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteReport(report._id)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      )}

      {/* Modal nộp/chỉnh sửa báo cáo */}
      <SubmitReportModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onSubmit={handleSubmitReport}
        editMode={editMode}
        selectedReport={selectedReport}
      />

      {/* Modal xem chi tiết báo cáo */}
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

export default ThesisReport;
