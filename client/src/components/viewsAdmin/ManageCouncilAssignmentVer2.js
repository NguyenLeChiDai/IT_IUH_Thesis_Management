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
  Tooltip,
} from "@mui/material";
import { apiUrl } from "../../contexts/constants";

const ManageCouncilAssignmentVer2 = () => {
  const [councilAssignments, setCouncilAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCouncilAssignments = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${apiUrl}/councilAssignment/get-all-assigned-groups`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          setCouncilAssignments(response.data.data);
          setLoading(false);
        } else {
          setError(response.data.message);
          setLoading(false);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Có lỗi xảy ra khi tải danh sách hội đồng"
        );
        setLoading(false);
      }
    };

    fetchCouncilAssignments();
  }, []);

  const renderTeachers = (teachers) => {
    return teachers.map((teacher) => (
      <Typography key={teacher.teacherId} variant="body2">
        {teacher.name} - {teacher.email}
      </Typography>
    ));
  };

  const renderGroups = (groups) => {
    return groups.map((group) => (
      <Typography key={group.groupId} variant="body2">
        {group.groupName || group.groupCode}
      </Typography>
    ));
  };

  const renderTopics = (topics) => {
    return topics.map((topic) => (
      <Tooltip
        key={topic.topicId}
        title={topic.topicDescription}
        placement="top"
      >
        <Typography variant="body2" style={{ cursor: "help" }}>
          {topic.topicName}
        </Typography>
      </Tooltip>
    ));
  };

  if (loading)
    return <Typography>Đang tải danh sách phân công hội đồng...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Card>
      <CardHeader
        title="Quản Lý Phân Công Hội Đồng Báo Cáo"
        subheader={`Tổng số: ${councilAssignments.length} hội đồng`}
      />
      <CardContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Hội Đồng</TableCell>
                <TableCell>Giảng Viên Hội Đồng</TableCell>
                <TableCell>Nhóm Sinh Viên</TableCell>
                <TableCell>Số Lượng Nhóm</TableCell>
                <TableCell>Ngày Phân Công</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {councilAssignments.map((assignment, index) => (
                <TableRow key={assignment.councilId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Box>{renderTeachers(assignment.teacherInfo)}</Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {assignment.assignedGroups &&
                      assignment.assignedGroups.length > 0 ? (
                        renderGroups(assignment.assignedGroups)
                      ) : (
                        <Typography variant="body2">
                          Chưa phân công nhóm
                        </Typography>
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    {assignment.assignedGroups
                      ? assignment.assignedGroups.length
                      : 0}
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.assignedDate).toLocaleDateString()}
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

export default ManageCouncilAssignmentVer2;
