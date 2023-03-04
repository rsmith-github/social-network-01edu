import React, { useState } from "react";
import { json, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [dob, setDob] = useState("");
  const [avatar, setAvatar] = useState("");
  const [nickname, setNickname] = useState("");
  const [about, setAbout] = useState("");
  const [status, setStatus] = useState("");
  const [redirectVar, setRedirectVar] = useState(false);

  // Redirect
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault(); // prevent reload.

    // Create new user as JS object.
    const newUser = {
      email,
      password,
      first,
      last,
      dob,
      avatar,
      nickname,
      about,
      status,
    };

    // Send user data to golang register function.
    const response = await fetch("http://localhost:8080/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    // let result = await response.json()
    // if (result.email === email) {
    setRedirectVar(true);
    // }
  };

  if (redirectVar) {
    return navigate("/login"); // This is still iffy!!! ????????????
  }

  return (
    <div>
      <main className="form-signin w-100 m-auto" style={{ display: "block" }}>
        <form onSubmit={submit}>
          <h1 className="h3 mb-3 fw-normal">Please register</h1>

          <div className="form-floating">
            <input
              required
              type="email"
              className="form-control"
              id="floatingInput"
              placeholder="name@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="floatingInput">Email address</label>
          </div>
          <div className="form-floating">
            <input
              required
              type="password"
              className="form-control reginput"
              id="regpassword"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="regpassword">Password</label>
          </div>
          <div className="form-floating">
            <input
              required
              type="text"
              className="form-control reginput"
              id="first"
              placeholder="John"
              onChange={(e) => setFirst(e.target.value)}
            />
            <label htmlFor="first">First Name</label>
          </div>
          <div className="form-floating">
            <input
              required
              type="text"
              className="form-control reginput"
              id="last"
              placeholder="Doe"
              onChange={(e) => setLast(e.target.value)}
            />
            <label htmlFor="last">Last Name</label>
          </div>
          <div className="form-floating">
            <input
              required
              type="date"
              className="form-control reginput"
              id="dob"
              placeholder="16/01/1998"
              onChange={(e) => setDob(e.target.value)}
            />
            <label htmlFor="last">Date of Birth</label>
          </div>
          <div className="form-floating">
            <input
              type="text"
              className="form-control reginput"
              id="avatar"
              placeholder="https://..."
              onChange={(e) => setAvatar(e.target.value)}
            />
            <label htmlFor="avatar">Avatar</label>
          </div>
          <div className="form-floating">
            <input
              type="text"
              className="form-control reginput"
              id="nickname"
              placeholder="Johnny"
              onChange={(e) => setNickname(e.target.value)}
            />
            <label htmlFor="nickname">Nickname</label>
          </div>
            <input
              required
              type="radio"
              id="private-status"
              value={"private"}
              name="status"
              onClick={(e) => setStatus(e.target.value)}
            />
            <label htmlFor="public-status">Private</label>
            <input
              required
              type="radio"
              id="public-status"
              value={"public"}
              name="status"
              onClick={(e) => setStatus(e.target.value)}
            />
            <label htmlFor="public-status">Public</label>
            <input
              className="form-control"
              name="aboutme"
              id="about"
              cols="30"
              rows="10"
              onChange={(e) => setAbout(e.target.value)}
            ></input>
            <label htmlFor="about">About me</label>
          <button className="w-100 btn btn-lg btn-primary" type="submit">
            Register
          </button>
        </form>
        <span>Already have an account? &nbsp;</span>
        <Link to="/login" style={{ color: "white" }}>
          Login
        </Link>
      </main>
    </div>
  );
}
