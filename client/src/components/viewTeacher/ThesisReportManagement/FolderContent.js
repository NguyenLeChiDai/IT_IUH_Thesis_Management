import React, { useState, useEffect } from "react";
import { Badge, Button, Table, Alert, Form } from "react-bootstrap";
import {
  Users,
  FileText,
  Eye,
  MessageSquare,
  Download,
  FileUp,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../../../css/FolderContent.css";
import Swal from "sweetalert2";
import { apiUrl } from "../../../contexts/constants";

const FolderContent = () => {
  const [loading, setLoading] = useState(true);
  const [folderData, setFolderData] = useState(null);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();
  const { folderId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 5;

  // Sắp xếp
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

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
        `${apiUrl}/reportManagements/folder-content/${folderId}`,
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
        `${apiUrl}/reportManagements/download-report/${reportId}`,
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
        `${apiUrl}/reportManagements/download-all/${folderId}`,
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

  const handleSubmitToAdmin = async (reportId) => {
    try {
      const result = await Swal.fire({
        title: "Xác nhận phê duyệt báo cáo",
        text: "Sau khi duyệt, báo cáo của sinh viên sẽ được gửi cho admin",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Phê duyệt",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        const response = await axios.post(
          `${apiUrl}/reportManagements/submit-to-admin/${reportId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          Swal.fire(
            "Đã phê duyệt!",
            "Báo cáo đã được gửi cho admin.",
            "success"
          );
          // Refresh the list or remove the specific report
          fetchFolderContent();
        }
      }
    } catch (error) {
      Swal.fire(
        "Lỗi!",
        error.response?.data?.message || "Không thể phê duyệt báo cáo",
        "error"
      );
    }
  };

  // Hàm sắp xếp
  const sortReports = (reportsToSort) => {
    if (!sortConfig.key) return reportsToSort;

    return [...reportsToSort].sort((a, b) => {
      if (a[sortConfig.key] == null) return 1;
      if (b[sortConfig.key] == null) return -1;

      if (sortConfig.key === "groupName" || sortConfig.key === "topicName") {
        const comparison = a[sortConfig.key].localeCompare(b[sortConfig.key]);
        return sortConfig.direction === "asc" ? comparison : -comparison;
      } else if (sortConfig.key === "submissionDate") {
        const dateA = new Date(a[sortConfig.key]);
        const dateB = new Date(b[sortConfig.key]);
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  };

  // Xử lý sắp xếp
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Render icon sắp xếp
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown size={16} className="ms-2 text-muted" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp size={16} className="ms-2 text-primary" />
    ) : (
      <ArrowDown size={16} className="ms-2 text-primary" />
    );
  };

  // Lọc và sắp xếp báo cáo
  const filteredAndSortedReports = sortReports(
    reports.filter(
      (report) =>
        report.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.members.some((member) =>
          member.toLowerCase().includes(searchTerm.toLowerCase())
        )
    )
  );

  // Phân trang
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredAndSortedReports.slice(
    indexOfFirstReport,
    indexOfLastReport
  );

  // Render phân trang
  const renderPagination = () => {
    const pageNumbers = [];
    const totalPages = Math.ceil(
      filteredAndSortedReports.length / reportsPerPage
    );

    const renderPageNumbers = () => {
      if (totalPages <= 5) {
        return pageNumbers.map((number) => (
          <Button
            key={number}
            variant={currentPage === number ? "primary" : "outline-primary"}
            className="me-1"
            onClick={() => setCurrentPage(number)}
          >
            {number}
          </Button>
        ));
      }

      let startPage, endPage;
      if (currentPage <= 3) {
        startPage = 1;
        endPage = 5;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
        endPage = totalPages;
      } else {
        startPage = currentPage - 2;
        endPage = currentPage + 2;
      }

      const displayPages = [];

      if (startPage > 1) {
        displayPages.push(
          <Button
            key="first"
            variant="outline-primary"
            className="me-1"
            onClick={() => setCurrentPage(1)}
          >
            1
          </Button>
        );

        if (startPage > 2) {
          displayPages.push(
            <span key="ellipsis1" className="me-1">
              ...
            </span>
          );
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        displayPages.push(
          <Button
            key={i}
            variant={currentPage === i ? "primary" : "outline-primary"}
            className="me-1"
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </Button>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          displayPages.push(
            <span key="ellipsis2" className="me-1">
              ...
            </span>
          );
        }

        displayPages.push(
          <Button
            key="last"
            variant="outline-primary"
            className="me-1"
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </Button>
        );
      }

      return displayPages;
    };

    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    //return phân trang
    return (
      <div className="d-flex justify-content-center align-items-center mt-3">
        <Button
          variant="outline-primary"
          className="me-2"
          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={16} />
        </Button>

        {renderPageNumbers()}

        <Button
          variant="outline-primary"
          className="ms-2"
          onClick={() =>
            currentPage < totalPages && setCurrentPage(currentPage + 1)
          }
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    );
  };

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

      {/* Thanh tìm kiếm */}
      <div className="mb-4">
        <Form.Control
          type="search"
          placeholder="Tìm kiếm nhóm, đề tài, thành viên..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
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
            <th>
              Nhóm
              <Button
                variant="link"
                className="p-0 ms-2"
                onClick={() => handleSort("groupName")}
              >
                {renderSortIcon("groupName")}
              </Button>
            </th>
            <th>Thành viên</th>
            {/* <th>MSSV</th> */}
            <th>
              Đề tài
              <Button
                variant="link"
                className="p-0 ms-2"
                onClick={() => handleSort("topicName")}
              >
                {renderSortIcon("topicName")}
              </Button>
            </th>
            <th>File</th>
            <th>
              Thời gian nộp
              <Button
                variant="link"
                className="p-0 ms-2"
                onClick={() => handleSort("submissionDate")}
              >
                {renderSortIcon("submissionDate")}
              </Button>
            </th>
            <th>Trạng thái nộp</th>
            {/* <th>Trạng thái xem</th> */}
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {currentReports.map((report) => (
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
                  className="me-2 p-1 d-flex align-items-center"
                  style={{
                    width: "130px",
                    height: "32px",
                    justifyContent: "center",
                  }}
                  onClick={() =>
                    navigate(`/dashboardTeacher/submission/${report.id}`)
                  }
                >
                  <MessageSquare size={16} /> Xem/nhận xét
                </Button>
                <Button
                  variant="info"
                  size="sm"
                  className="me-2 p-1 d-flex align-items-center"
                  style={{
                    width: "130px",
                    height: "32px",
                    justifyContent: "center",
                    marginTop: "3px",
                  }}
                  onClick={() => handleDownload(report.id, report.fileName)}
                  disabled={loading}
                >
                  <Download size={16} /> Tải xuống
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="me-2 p-1 d-flex align-items-center"
                  style={{
                    width: "130px",
                    height: "32px",
                    justifyContent: "center",
                    marginTop: "3px",
                  }}
                  onClick={() => handleSubmitToAdmin(report.id)}
                >
                  <FileUp size={16} /> Phê duyệt
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Phân trang */}
      {filteredAndSortedReports.length > reportsPerPage && renderPagination()}

      {/* Trạng thái trống */}
      {(!currentReports || currentReports.length === 0) && (
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
