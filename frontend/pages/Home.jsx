import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProfileImgContainer from "../components/ProfileImgContainer";

export default function Home(props) {
  return (
    <div>
      {props.name ? (
        <ProfileImgContainer
          name={props.name}
          user={props.user}
          avatar={props.avatar}
        />
      ) : (
        <>
          <p>You are not logged in</p>
          <Link to="/login">Login</Link>
        </>
      )}
    </div>
  );
}
