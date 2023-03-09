import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { AllPosts } from "../components/AllPosts";

import ProfileImgContainer from "../components/ProfileImgContainer";
import RightSide from "../components/RightSide";
import Swal from "sweetalert2";

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
      <AllPosts />
    </div>
  );
}
