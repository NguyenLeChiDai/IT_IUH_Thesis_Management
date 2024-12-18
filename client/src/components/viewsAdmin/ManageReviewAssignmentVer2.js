import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from "@mui/material";
import { apiUrl } from "../../contexts/constants";

const ManageReviewAssignmentVer2 = () => {
  const [reviewAssignments, setReviewAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviewAssignments = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${apiUrl}/reviewAssignment/get-all-review-assignments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setReviewAssignments(response.data.reviewAssignments || []);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách phân công:", err);
        setError(err.response?.data?.message || "Có lỗi xảy ra");
        setLoading(false);
      }
    };

    fetchReviewAssignments();
  }, []);

  const renderTeachers = (teachers) => {
    if (!teachers || teachers.length === 0) {
      return <Typography variant="body2">Chưa có giảng viên</Typography>;
    }
    return teachers.map((teacher) => (
      <Typography key={teacher._id} variant="body2">
        {teacher.name} - {teacher.email}
      </Typography>
    ));
  };

  const renderGroups = (groups) => {
    if (!groups || groups.length === 0) {
      return <Typography variant="body2">Chưa phân công nhóm</Typography>;
    }
    return groups.map((group) => (
      <Typography key={group._id} variant="body2">
        {group.groupName}
      </Typography>
    ));
  };

  if (loading) return <Typography>Đang tải danh sách phân công...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Card>
      <CardHeader
        title="Quản Lý Phân Công Hội Đồng Phản Biện"
        subheader={`Tổng số: ${reviewAssignments.length} phân công`}
      />
      <CardContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Hội Đồng</TableCell>
                {/* <TableCell>Hội Đồng</TableCell> */}
                <TableCell>Giảng Viên Phản Biện</TableCell>
                <TableCell>Nhóm Sinh Viên</TableCell>
                <TableCell>Số Lượng Nhóm</TableCell>
                <TableCell>Ngày Phân Công</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviewAssignments.map((assignment, index) => (
                <TableRow key={assignment._id}>
                  <TableCell>{index + 1}</TableCell>
                  {/*  <TableCell>
                    {assignment.councilName || "Chưa đặt tên"}
                  </TableCell> */}
                  <TableCell>
                    <Box>{renderTeachers(assignment.reviewerTeacher)}</Box>
                  </TableCell>
                  <TableCell>
                    <Box>{renderGroups(assignment.studentGroup)}</Box>
                  </TableCell>
                  <TableCell>{assignment.studentGroup?.length || 0}</TableCell>
                  <TableCell>
                    {assignment.assignedDate
                      ? new Date(assignment.assignedDate).toLocaleDateString()
                      : "Chưa xác định"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default ManageReviewAssignmentVer2;
