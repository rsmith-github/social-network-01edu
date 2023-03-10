import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PostForm from "../components/PostForm";
import ProfileImgContainer from "../components/ProfileImgContainer";
import RightSide from "../components/RightSide";
import { GetChat } from "../components/Chatrooms";
import { GroupContainer } from "../components/GroupContainer";

export default function Home(props) {
  return (
    <main>
      <div className="contentContainer">
        {props.name ? (
          <>
            <ProfileImgContainer
              name={props.name}
              user={props.user}
              avatar={props.avatar}
            />
            <GroupContainer groups={props.groups} socket={props.socket}/>
            <PostForm avatar={props.avatar} />
            <RightSide />
            <GetChat />
          </>
        ) : (
          <>
            <p>You are not logged in</p>
            <Link to="/login">Login</Link>
          </>
        )}
      </div>
    </main>
  );
}
