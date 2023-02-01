import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ProfileImgContainer from "../components/ProfileImgContainer";

export default function Profile(props) {
  return (
    <div>
      <ProfileImgContainer
        name={props.name}
        user={props.user}
        avatar={props.avatar}
      />
      <p>{props.user.email}</p>
      <p>{props.user.last}</p>
      <p>{props.user.dob}</p>
      <p>{props.user.nickname}</p>
    </div>
  );
}
