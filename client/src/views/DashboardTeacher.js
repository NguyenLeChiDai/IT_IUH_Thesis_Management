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
  Collapse,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import GroupIcon from "@mui/icons-material/Group";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import TeacherInfo from "../components/viewTeacher/TeacherInfo";
import UserMenu from "../components/viewStudent/UserMenu";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import StarIcon from "@mui/icons-material/Star";
import EditIcon from "@mui/icons-material/Edit";
import PeopleIcon from "@mui/icons-material/People";
import ListAltIcon from "@mui/icons-material/ListAlt";
import DocumentScannerIcon from "@mui/icons-material/DocumentScanner";
import "../css/DashboardTeacher.css";

const drawerWidth = 240;

const DashboardTeacher = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width:600px)");

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
      onClick: () => navigate("/dashboardTeacher"),
    },
    {
      text: "Quản lý báo cáo",
      icon: <GroupIcon />,
      submenu: [
        {
          text: "Báo cáo của sinh viên",
          icon: <DocumentScannerIcon />,
          onClick: () => navigate("/dashboardTeacher/manage-report-student"),
        },
      ],
    },
    {
      text: "Đề Tài",
      icon: <AssignmentIcon />,
      submenu: [
        {
          text: "Quản Lý Đề Tài",
          icon: <CloudUploadIcon />,
          onClick: () => navigate("/dashboardTeacher/upload-topic"),
        },
      ],
    },
    {
      text: "Quản Lý Sinh Viên",
      icon: <PeopleIcon />,
      submenu: [
        {
          text: "Danh Sách Sinh Viên",
          icon: <ListAltIcon />,
          onClick: () => navigate("/dashboardTeacher/input-score"),
        },
      ],
    },
    {
      text: "Điểm",
      icon: <StarIcon />,
      submenu: [
        {
          text: "Nhập Điểm",
          icon: <EditIcon />,
          onClick: () => navigate("/dashboardTeacher/upload-topic"),
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
          width:
            sidebarOpen && !isMobile ? `calc(100% - ${drawerWidth}px)` : "100%",
          ml: sidebarOpen && !isMobile ? `${drawerWidth}px` : 0,
          height: "70px",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleSidebar}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h5"
            noWrap
            component="div"
            className="dashboard-title"
          >
            Dashboard Giảng viên
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
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        sx={{
          width: "150px",
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <List>
          {menuItems.map((item, index) => (
            <div key={index}>
              <ListItem
                button
                onClick={() => {
                  if (item.submenu) {
                    handleToggleSubMenu(index);
                  } else if (item.onClick) {
                    item.onClick();
                  }
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
                {item.submenu &&
                  (openSubMenu[index] ? <ExpandLess /> : <ExpandMore />)}
              </ListItem>
              {item.submenu && (
                <Collapse in={openSubMenu[index]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.submenu.map((subItem, subIndex) => (
                      <ListItem
                        button
                        key={subIndex}
                        onClick={subItem.onClick}
                        sx={{ pl: 4 }}
                      >
                        <ListItemIcon>{subItem.icon}</ListItemIcon>
                        <ListItemText primary={subItem.text} />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </div>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width:
            sidebarOpen && !isMobile ? `calc(100% - ${drawerWidth}px)` : "100%",
          ml: sidebarOpen && !isMobile ? `${drawerWidth}px` : 0,
          transition: "width 0.3s",
        }}
      >
        <Toolbar />
        <Box className="main-content">
          {location.pathname === "/dashboardTeacher" && (
            <>
              <Typography variant="h5" className="teacher-info-title">
                Thông tin giảng viên
              </Typography>
              <TeacherInfo />
            </>
          )}
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardTeacher;
