import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  CssBaseline,
  useMediaQuery,
  Collapse, // Thêm Collapse từ MUI
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandLess from "@mui/icons-material/ExpandLess"; // Icon mở rộng
import ExpandMore from "@mui/icons-material/ExpandMore"; // Icon thu gọn
import SchoolIcon from "@mui/icons-material/School";
import HomeIcon from "@mui/icons-material/Home";
import GroupsIcon from "@mui/icons-material/Groups";
import UserMenu from "../components/viewStudent/UserMenu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { Outlet, useNavigate } from "react-router-dom";
import TopicIcon from "@mui/icons-material/Topic";
import ArticleIcon from "@mui/icons-material/Article";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import SendIcon from "@mui/icons-material/Send";
import CoPresentIcon from "@mui/icons-material/CoPresent";
import PresentToAllIcon from "@mui/icons-material/PresentToAll";
import EditNotificationsIcon from "@mui/icons-material/EditNotifications";
import SummarizeIcon from "@mui/icons-material/Summarize";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

const drawerWidth = 240;

const DashboardAdmin = () => {
  const [open, setOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState({}); // State cho menu con
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)"); // Xác định nếu là màn hình nhỏ

  const toggleDrawer = () => {
    setOpen(!open);
  };

  // Toggle menu con
  const handleToggleSubMenu = (index) => {
    setOpenSubMenu((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const menuItems = [
    {
      text: "Trang chủ",
      icon: <HomeIcon />,
      onClick: () => navigate("/dashboardAdmin"),
    },
    {
      text: "Quản lý giảng viên",
      icon: <SchoolIcon />,
      subMenu: [
        {
          text: "Quản lý tài khoản giảng viên",
          icon: <AccountCircleIcon />,
          onClick: () => navigate("/dashboardAdmin/manage-teacher-accounts"),
        },
      ],
    },
    {
      text: "Quản lý sinh viên",
      icon: <AccountBoxIcon />,
      subMenu: [
        {
          text: "Quản lý tài khoản sinh viên",
          icon: <AccountCircleIcon />,
          onClick: () => navigate("/dashboardAdmin/manage-student-accounts"),
        },
        {
          text: "Nhóm sinh viên", // Thêm mục "Nhóm sinh viên"
          icon: <GroupsIcon />,
          onClick: () => navigate("/dashboardAdmin/student-groups"), // Chuyển đến trang "Nhóm sinh viên"
        },
      ],
    },
    {
      text: "Quản lý đề tài",
      icon: <ArticleIcon />,
      subMenu: [
        {
          text: "Đề tài của giảng viên",
          icon: <TopicIcon />,
          onClick: () => navigate("/dashboardAdmin/manage-topics"),
        },
        {
          text: "Danh sách đề tài", // Thêm mục "Nhóm sinh viên"
          icon: <ListAltIcon />,
          onClick: () => navigate("/dashboardAdmin"), // Chuyển đến trang "Nhóm sinh viên"
        },
      ],
    },
    // Quản lý báo cáo
    {
      text: "Quản lý báo cáo",
      icon: <SummarizeIcon />,
      subMenu: [
        {
          text: "Báo cáo khóa luận của sinh viên",
          icon: <InsertDriveFileIcon />,
          onClick: () => navigate("/dashboardAdmin/AdminReportList"),
        },
      ],
    },

    // gửi thông báo
    {
      text: "Thông báo",
      icon: <EditNotificationsIcon />,
      subMenu: [
        {
          text: "Gửi thông báo tổng",
          icon: <SendIcon />,
          onClick: () => navigate("/dashboardAdmin/notifications"),
        },
      ],
    },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: open && !isMobile ? `calc(100% - ${drawerWidth}px)` : "100%",
          ml: open && !isMobile ? `${drawerWidth}px` : 0,
          height: "70px",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Trang quản lý dành cho Admin
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box
            sx={{ display: "flex", alignItems: "center", marginBottom: "16px" }}
          >
            <UserMenu />
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={open}
        onClose={toggleDrawer}
        sx={{
          width: "60px", //độ rộng của thanh dọc sau drawer
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <List>
          {menuItems.map((item, index) => (
            <React.Fragment key={index}>
              <ListItem
                button
                onClick={
                  item.subMenu ? () => handleToggleSubMenu(index) : item.onClick // Gọi trực tiếp onClick nếu không có subMenu
                }
                sx={{
                  "&:hover": {
                    backgroundColor: "#BFBFBF", // Màu nền khi hover
                    fontWeight: "bold", // Chữ đậm hơn khi hover
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
                {item.subMenu &&
                  (openSubMenu[index] ? <ExpandLess /> : <ExpandMore />)}
              </ListItem>
              {/* Hiển thị các subMenu khi openSubMenu[index] = true */}
              <Collapse in={openSubMenu[index]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subMenu &&
                    item.subMenu.map((subItem, subIndex) => (
                      <ListItem
                        button
                        key={subIndex}
                        sx={{
                          pl: 4,
                          "&:hover": {
                            backgroundColor: "#BFBFBF", // Màu nền khi hover
                            fontWeight: "bold", // Chữ đậm hơn khi hover
                          },
                        }}
                        onClick={subItem.onClick}
                      >
                        <ListItemIcon>{subItem.icon}</ListItemIcon>
                        <ListItemText primary={subItem.text} />
                      </ListItem>
                    ))}
                </List>
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: open && !isMobile ? `calc(100% - ${drawerWidth}px)` : "100%",
          ml: open && !isMobile ? `${drawerWidth}px` : 0,
          p: 3,
          transition: "width 0.3s",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardAdmin;
