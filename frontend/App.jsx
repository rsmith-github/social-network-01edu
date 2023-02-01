import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NavBar from "./components/navbar";
import Profile from "./pages/Profile";

const root = ReactDOM.createRoot(document.querySelector("#app"));

function App() {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [props, setProps] = useState({});

  useEffect(() => {
    (async () => {
      // Send user data to golang register function.
      const response = await fetch("http://localhost:8080/api/user", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const content = await response.json();

      setName(content.first);
      setAvatar(content.avatar);

      const user = {
        email: content.email,
        last: content.last,
        dob: content.dob,
        nickname: content.nickname,
        aboutme: content.about,
      };

      setProps(user);
    })();
  });

  return (
    <BrowserRouter>
      <NavBar name={name} setName={setName} />
      <Routes>
        <Route
          index
          element={<Home name={name} avatar={avatar} user={props} />}
        />
        <Route path="/login" element={<Login setName={setName} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile"
          element={<Profile name={name} avatar={avatar} user={props} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

root.render(<App />);
