import React from "react";
import { Modal, Button, Table } from "react-bootstrap";
import { FileText, Download } from "lucide-react";

const ViewReportModal = ({ show, onHide, report, onEdit, onDownload }) => {
  if (!report) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Chi tiết báo cáo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="report-details">
          <div className="mb-4">
            <h5 className="mb-3">Thông tin báo cáo</h5>
            <Table borderless>
              <tbody>
                <tr>
                  <td className="fw-bold" style={{ width: "200px" }}>
                    Tên báo cáo:
                  </td>
                  <td>{report.title}</td>
                </tr>
                <tr>
                  <td className="fw-bold">Mô tả:</td>
                  <td>{report.description}</td>
                </tr>
                <tr>
                  <td className="fw-bold">Thời gian nộp:</td>
                  <td>{new Date(report.submissionDate).toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="fw-bold">Trạng thái:</td>
                  <td>{report.status}</td>
                </tr>
                <tr>
                  <td className="fw-bold">File đính kèm:</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <FileText size={16} className="me-2" />
                      {report.fileName}
                      <Button
                        variant="link"
                        className="ms-2"
                        onClick={() =>
                          onDownload(report.fileUrl, report.fileName)
                        }
                      >
                        <Download size={16} className="me-1" />
                        Tải xuống
                      </Button>
                    </div>
                  </td>
                </tr>
                {report.teacherNote && (
                  <tr>
                    <td className="fw-bold">Nhận xét của giảng viên:</td>
                    <td>{report.teacherNote}</td>
                  </tr>
                )}
                {report.viewedDate && (
                  <tr>
                    <td className="fw-bold">Ngày xem:</td>
                    <td>{new Date(report.viewedDate).toLocaleString()}</td>
                  </tr>
                )}
                {report.isLate && (
                  <tr>
                    <td className="fw-bold">Trạng thái nộp:</td>
                    <td className="text-danger">
                      Nộp muộn ({report.lateTime})
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          {report.teacherFileUrl && (
            <div className="mt-3">
              <h5 className="mb-3">File phản hồi từ giảng viên</h5>
              <div className="d-flex align-items-center">
                <FileText size={16} className="me-2" />
                {report.teacherFileName}
                <Button
                  variant="link"
                  className="ms-2"
                  onClick={() =>
                    onDownload(report.teacherFileUrl, report.teacherFileName)
                  }
                >
                  <Download size={16} className="me-1" />
                  Tải xuống
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Đóng
        </Button>
        {report.status === "GV chưa xem" && (
          <Button variant="primary" onClick={onEdit}>
            Chỉnh sửa
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ViewReportModal;
