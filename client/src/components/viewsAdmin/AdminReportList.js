import React, { useState, useEffect } from "react";
import { Table, Button, Container } from "react-bootstrap";
import axios from "axios";
import { Eye, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../contexts/constants";

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminReports();
  }, []);

  const fetchAdminReports = async () => {
    try {
      const response = await axios.get(`${apiUrl}/adminReport/admin/reports`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.data.success) {
        setReports(response.data.reports);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching admin reports:", error);
      setLoading(false);
    }
  };

  const handleDownload = async (reportId, fileName) => {
    try {
      const response = await axios.get(
        `${apiUrl}/adminReport/admin/download-report/${reportId}`,
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
      console.error("Download error:", error);
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <Container fluid className="mt-4">
      <h2>Danh sách báo cáo được phê duyệt</h2>
      <Table responsive striped bordered hover>
        <thead>
          <tr>
            <th>Nhóm</th>
            <th>Sinh viên</th>
            <th>Đề tài</th>
            <th>Giảng viên</th>
            <th>Thư mục</th>
            <th>Ngày gửi</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report._id}>
              <td>{report.group?.groupName || "Chưa có nhóm"}</td>
              <td>
                {report.students.map((student, index) => (
                  <div key={student._id}>
                    {student.name} ({student.studentId})
                    {index < report.students.length - 1 ? ", " : ""}
                  </div>
                ))}
              </td>
              <td>{report.topic?.nameTopic}</td>
              <td>{report.teacher?.name}</td>
              <td>{report.folder?.name}</td>
              <td>{new Date(report.teacherApprovalDate).toLocaleString()}</td>
              <td>
                <Button
                  variant="info"
                  size="sm"
                  className="me-1"
                  onClick={() => handleDownload(report._id, report.fileName)}
                >
                  <Download size={16} /> Tải xuống
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    navigate(`/dashboardAdmin/adminReportDetail/${report._id}`)
                  }
                >
                  <Eye size={16} /> Chi tiết
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {reports.length === 0 && (
        <div className="text-center py-5">
          <p className="text-muted">Không có báo cáo nào được phê duyệt</p>
        </div>
      )}
    </Container>
  );
};

export default AdminReports;
