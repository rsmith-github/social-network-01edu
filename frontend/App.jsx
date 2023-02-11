import React, { useState, useEffect, StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NavBar from "./components/navbar";
import Profile from "./pages/Profile";
import PublicProfiles from "./pages/PublicProfiles";

const root = ReactDOM.createRoot(document.querySelector("#app"));

function App() {
  // Current user state vars.
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [props, setProps] = useState({});

  // All users state vars
  const [users, setUsers] = useState([]);

  useEffect(() => {
    (async () => {
      // validate user based on session.
      const response = await fetch("http://localhost:8080/api/user", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const content = await response.json(); //getting current user.

      // Set user details
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
  }, [name]);

  useEffect(() => {
    (async () => {
      // Fetch users from "all users" api
      const usersPromise = await fetch("http://localhost:8080/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const usersJson = await usersPromise.json(); //getting current user.
      setUsers(usersJson);
    })();
  }, []);

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
          path="/profile/"
          element={<Profile name={name} avatar={avatar} user={props} />}
        />
        <Route
          path="/public-profiles"
          element={<PublicProfiles users={users} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

root.render(<App />);
