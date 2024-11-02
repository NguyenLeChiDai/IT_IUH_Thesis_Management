import React, { useState, useEffect } from "react";
import { Badge, Button, Table, Alert } from "react-bootstrap";
import {
  Users,
  FileText,
  Eye,
  MessageSquare,
  Download,
  FileUp,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../../css/FolderContent.css";

const FolderContent = () => {
  const [loading, setLoading] = useState(true);
  const [folderData, setFolderData] = useState(null);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();
  const { folderId } = useParams();

  useEffect(() => {
    fetchFolderContent();
  }, [folderId]);

  const fetchFolderContent = async () => {
    if (!folderId) {
      showAlert("ID thư mục không hợp lệ", "danger");
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/api/reportManagements/folder-content/${folderId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.data.success) {
        setFolderData(response.data.data.folder);
        setReports(response.data.data.reports);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error("Error fetching folder content:", error);
      showAlert(
        error.response?.data?.message || "Lỗi khi tải dữ liệu",
        "danger"
      );
      // Nếu lỗi là do ID không hợp lệ, quay về trang trước
      if (error.response?.status === 404) {
        navigate(-1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId, fileName) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/reportManagements/download-report/${reportId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          responseType: "blob",
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
      showAlert("Lỗi khi tải file", "danger");
    }
  };

  const handleDownloadAll = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/reportManagements/download-all/${folderId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `reports-${folderId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showAlert("Lỗi khi tải tất cả file", "danger");
    }
  };

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="container-fluid mt-4">
      {alert && (
        <Alert
          variant={alert.type}
          className="position-fixed top-0 end-0 m-3"
          style={{ zIndex: 1050 }}
        >
          {alert.message}
        </Alert>
      )}

      <Button variant="link" className="mb-3 p-0" onClick={() => navigate(-1)}>
        <ArrowLeft className="me-2" />
        Quản lý báo cáo
      </Button>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{folderData?.name || "Nội dung thư mục"}</h2>
        <div>
          <Badge bg="info" className="me-2">
            Tổng số bài nộp: {stats?.totalSubmissions || 0}
          </Badge>
          <Badge bg="success" className="me-2">
            Đúng hạn: {stats?.onTimeSubmissions || 0}
          </Badge>
          <Badge bg="danger">Trễ hạn: {stats?.lateSubmissions || 0}</Badge>
        </div>
      </div>

      {reports?.length > 0 && (
        <Button
          variant="primary"
          className="mb-3"
          onClick={handleDownloadAll}
          disabled={loading}
        >
          <Download className="me-2" />
          Tải tất cả báo cáo
        </Button>
      )}

      <Table responsive striped bordered hover>
        <thead>
          <tr>
            <th>Nhóm</th>
            <th>Thành viên</th>
            {/* <th>MSSV</th> */}
            <th>Đề tài</th>
            <th>File</th>
            <th>Thời gian nộp</th>
            <th>Trạng thái nộp</th>
            {/* <th>Trạng thái xem</th> */}
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>{report.groupName}</td>
              <td>
                <div className="d-flex align-items-center">
                  <Users size={16} className="me-1" />
                  {report.members.join(", ")}
                </div>
              </td>
              {/*  <td>{report.studentId}</td> */}
              <td style={{ wordBreak: "break-word", overflow: "hidden" }}>
                {report.topicName}
              </td>
              <td>
                <div
                  className="d-flex align-items-center"
                  style={{ wordBreak: "break-word", overflow: "hidden" }}
                >
                  <FileText size={16} className="me-1" />
                  {report.fileName}
                </div>
              </td>
              <td>{new Date(report.submissionDate).toLocaleString()}</td>
              <td>
                <Badge
                  bg={report.status.includes("Trễ") ? "danger" : "success"}
                >
                  {report.status}
                </Badge>
              </td>
              {/*  <td>
                <Badge
                  bg={report.viewStatus === "Chưa xem" ? "warning" : "info"}
                >
                  {report.viewStatus}
                </Badge>
              </td> */}
              <td>
                {/*  <Button
                  variant="primary"
                  size="sm"
                  className="me-1"
                  onClick={() =>
                    navigate(`/dashboardTeacher/submission/${report.id}`)
                  }
                >
                  <Eye size={16} /> Xem và nhận xét
                </Button> */}
                <Button
                  variant="success"
                  size="sm"
                  className="me-1"
                  onClick={() =>
                    navigate(`/dashboardTeacher/submission/${report.id}`)
                  }
                >
                  <MessageSquare size={16} /> Xem / nhận xét
                </Button>
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => handleDownload(report.id, report.fileName)}
                  disabled={loading}
                >
                  <Download size={16} /> Tải xuống
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {(!reports || reports.length === 0) && (
        <div className="text-center py-5">
          <FileUp size={48} className="text-muted mb-3" />
          <p className="text-muted mb-0">
            Chưa có bài nộp nào trong thư mục này
          </p>
        </div>
      )}
    </div>
  );
};

export default FolderContent;
