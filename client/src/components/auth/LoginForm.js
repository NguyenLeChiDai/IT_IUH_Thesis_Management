import React from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Link, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import AlertMessage from "../layout/AlertMessage";

function LoginForm() {
  // Context
  const { loginUser } = useContext(AuthContext);
  //Router
  const navigate = useNavigate();

  // Local state
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  const [alert, setAlert] = useState(null);

  const { username, password } = loginForm;

  const onChangeLoginForm = (event) =>
    setLoginForm({ ...loginForm, [event.target.name]: event.target.value });

  const login = async (event) => {
    event.preventDefault();

    try {
      const loginData = await loginUser(loginForm);
      console.log(loginData); // Kiểm tra kết quả trả về của loginUser
      if (loginData.success) {
        console.log("Đăng nhập thành công");
        // navigate("/dashboard");
      } else {
        setAlert({ type: "danger", message: loginData.message });
        setTimeout(() => setAlert(null), 5000); //set thời gian cho thông báo đăng nhập
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Form onSubmit={login}>
        <AlertMessage info={alert} />

        <Form.Group>
          <h6 style={{ color: "black", textAlign: "left" }}>Tên đăng nhập</h6>
          <Form.Control
            type="text"
            placeholder="Tên đăng nhập"
            name="username"
            required
            value={username}
            onChange={onChangeLoginForm}
          />
        </Form.Group>
        <Form.Group>
          <h6 style={{ color: "black", textAlign: "left" }}>Mật khẩu</h6>
          <Form.Control
            type="password"
            placeholder="Mật khẩu"
            name="password"
            required
            value={password}
            onChange={onChangeLoginForm}
          />
        </Form.Group>
        <Button style={{ marginTop: "10px" }} variant="success" type="submit">
          Đăng nhập
        </Button>
      </Form>
      <p>
        Bạn chưa có tài khoản?
        <Link to="/register">
          <Button
            style={{ marginTop: "12px" }}
            variant="info"
            size="sm"
            className="ml-2"
          >
            Đăng ký
          </Button>
        </Link>
      </p>
    </>
  );
}

export default LoginForm;
