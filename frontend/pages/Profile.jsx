import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ProfileImgContainer from "../components/ProfileImgContainer";
import RightSide from "../components/RightSide";

export default function Profile(props) {
  return (
    <div className="profileContainer">
      <ProfileImgContainer
        name={props.name}
        user={props.user}
        avatar={props.avatar}
        socket={props.socket}
        currentUser={props.currentUser}
        fetchUsersData={props.fetchUsersData}
        update={props.update}
        setUpdate={props.setUpdate}
      />
      <div>
        <p>{props.user.email}</p>
        <p>{props.user.nickname}</p>
        <p>{props.user.last}</p>
        <p>{props.user.dob}</p>
      </div>
    </div>
  );
}
