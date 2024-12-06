import React, { useState, useEffect } from "react";
import { Button, Table, Form, Badge } from "react-bootstrap";
import { Search, Calendar, FileText, Folder } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import ThesisReportDetails from "../viewStudent/ThesisReportModel/ThesisReportDetails";
import "../../css/ThesisReport.css";
import { apiUrl } from "../../contexts/constants";
const ThesisReport = () => {
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFolderDetails, setShowFolderDetails] = useState(false);
  const [folderSubmissionStatus, setFolderSubmissionStatus] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeFolders = async () => {
      try {
        setError(null);
        const response = await axios.get(
          `${apiUrl}/thesisReports/student-folders`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          const folders = response.data.folders;
          setFolders(folders);

          // Chỉ lấy trạng thái nộp báo cáo nếu có thư mục
          if (folders.length > 0) {
            const submissionStatuses = {};
            for (const folder of folders) {
              try {
                const reportsResponse = await axios.get(
                  `${apiUrl}/thesisReports/get-folder-reports/${folder._id}`,
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
              } catch (err) {
                console.error(
                  `Error fetching reports for folder ${folder._id}:`,
                  err
                );
              }
            }
            setFolderSubmissionStatus(submissionStatuses);
          }
        }
      } catch (error) {
        console.error("Error initializing folders:", error);
        if (error.response?.data?.message) {
          setError(error.response.data.message);
          toast.error(error.response.data.message);
        } else {
          setError("Có lỗi xảy ra khi tải dữ liệu thư mục");
          toast.error("Có lỗi xảy ra khi tải dữ liệu thư mục");
        }
      } finally {
        setLoading(false);
      }
    };

    initializeFolders();
  }, []);

  ////////////////////////

  const handleFolderClick = (folder) => {
    setSelectedFolder(folder);
    setShowFolderDetails(true);
  };

  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showFolderDetails && selectedFolder) {
    return (
      <ThesisReportDetails
        selectedFolder={selectedFolder}
        onBack={() => setShowFolderDetails(false)}
        folderSubmissionStatus={folderSubmissionStatus}
        setFolderSubmissionStatus={setFolderSubmissionStatus}
      />
    );
  }

  return (
    <div className="thesis-report-container">
      <h2 className="mb-4 text-center">Quản lý báo cáo khóa luận</h2>

      <div className="mb-4 position-relative">
        <Form.Control
          type="search"
          placeholder="Tìm kiếm theo tên thư mục báo cáo"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input ps-4"
        />
        <Search
          size={16}
          className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"
        />
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : (
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
                      folderSubmissionStatus[folder._id] ? "success" : "warning"
                    }
                  >
                    {folderSubmissionStatus[folder._id] ? "Đã nộp" : "Chưa nộp"}
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
      )}

      {!loading && (!filteredFolders || filteredFolders.length === 0) && (
        <div className="text-center py-5">
          <FileText size={48} className="text-muted mb-3" />
          <p className="text-muted mb-0">Chưa có thư mục nào được tạo</p>
        </div>
      )}
    </div>
  );
};

export default ThesisReport;
