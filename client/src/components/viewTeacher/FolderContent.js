import React, { useState } from "react";
import { Badge, Button, Table } from "react-bootstrap";
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

const FolderContent = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { folderId } = useParams();
  const [currentFolder, setCurrentFolder] = useState(null);

  // Mock data (thay thế bằng API call thực tế)
  const mockSubmissions = [
    {
      id: 1,
      groupName: "Nhóm 1",
      members: ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C"],
      file: "baocao_nhom1.pdf",
      fileSize: "2.5 MB",
      submissionTime: "2024-03-20 14:30",
      status: "Đúng hạn",
    },
    // ... other submissions
  ];

  const handleDownload = (file) => {
    setLoading(true);
    setTimeout(() => {
      console.log(`Downloading file: ${file}`);
      setLoading(false);
    }, 1000);
  };

  const handleDownloadAll = (submissions) => {
    setLoading(true);
    setTimeout(() => {
      console.log(
        "Downloading all files:",
        submissions.map((sub) => sub.file)
      );
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="container-fluid mt-4">
      <Button variant="link" className="mb-3 p-0" onClick={() => navigate(-1)}>
        <ArrowLeft className="me-2" />
        Quản lý báo cáo
      </Button>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{currentFolder?.name || "Nội dung thư mục"}</h2>
        <div>
          <Badge bg="info" className="me-2">
            Tổng số bài nộp: {mockSubmissions?.length || 0}
          </Badge>
          <Badge bg="success">
            Đúng hạn:{" "}
            {mockSubmissions?.filter((s) => s.status === "Đúng hạn").length ||
              0}
          </Badge>
        </div>
      </div>

      {mockSubmissions?.length > 0 && (
        <Button
          variant="primary"
          className="mb-3"
          onClick={() => handleDownloadAll(mockSubmissions)}
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
            <th>File</th>
            <th>Thời gian nộp</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {mockSubmissions.map((submission) => (
            <tr key={submission.id}>
              <td>{submission.groupName}</td>
              <td>
                <div className="d-flex align-items-center">
                  <Users size={16} className="me-1" />
                  {submission.members.join(", ")}
                </div>
              </td>
              <td>
                <div className="d-flex align-items-center">
                  <FileText size={16} className="me-1" />
                  {submission.file}
                  <small className="text-muted ms-2">
                    ({submission.fileSize})
                  </small>
                </div>
              </td>
              <td>{submission.submissionTime}</td>
              <td>
                <Badge
                  bg={submission.status === "Đúng hạn" ? "success" : "danger"}
                >
                  {submission.status}
                </Badge>
              </td>
              <td>
                <Button
                  variant="primary"
                  size="sm"
                  className="me-1"
                  onClick={() =>
                    navigate(`/dashboardTeacher/submission/${submission.id}`)
                  }
                >
                  <Eye size={16} />
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  className="me-1"
                  onClick={() =>
                    navigate(`/dashboardTeacher/submission/${submission.id}`)
                  }
                >
                  <MessageSquare size={16} />
                </Button>
                <Button
                  variant="info"
                  size="sm"
                  onClick={() => handleDownload(submission.file)}
                  disabled={loading}
                >
                  <Download size={16} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {(!mockSubmissions || mockSubmissions.length === 0) && (
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
