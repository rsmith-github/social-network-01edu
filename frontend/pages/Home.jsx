import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Home(props) {
  return (
    <div>
      {props.name ? (
        <>
          <img
            src={props.avatar}
            alt=""
            style={{ borderRadius: "50%", width: "200px" }}
          />
          <h1> Hi {props.name}</h1>
        </>
      ) : (
        <>
          <p>You are not logged in</p>
          <Link to="/login">Login</Link>
        </>
      )}
    </div>
  );
}
