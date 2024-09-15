import React from "react";
import { Navigate } from "react-router-dom"; // Không cần import 'redirect' nữa

const Landing = () => {
  return <Navigate to="/trangchu" />;
};

export default Landing;
