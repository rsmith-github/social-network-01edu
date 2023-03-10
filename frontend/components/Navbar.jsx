import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function NavBar(props) {
  const logout = async () => {
    await fetch("http://localhost:8080/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    console.log(props);
    props["closeConn"]();
    props.setName("");
  };

  const onHover = (ev) => {
    ev.target.click();
  };

  return (
    <nav
      className="navbar navbar-expand-md navbar-dark"
      style={{
        backgroundColor: "RGB(148, 28, 47)",
        boxShadow:
          "rgb(0 0 0 / 30%) 0px 4px 6px -1px, rgb(0 0 0 / 6%) 0px 2px 4px -1px",
      }}
    >
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarCollapse"
        style={{ marginLeft: "10px" }}
        onMouseEnter={onHover}
      >
        <span className="navbar-toggler-icon"></span>
      </button>
      <span className="navbar-brand" style={{ marginLeft: "10px" }}>
        Social Network
      </span>
      <div className="container-fluid">
        <div className="collapse navbar-collapse" id="navbarCollapse">
          <ul className="navbar-nav me-auto mb-2 mb-md-0">
            {props.name ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/">
                    Home
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/public-profiles">
                    Public Profiles
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" onClick={logout} to="/login">
                    Logout
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
