import React, { useEffect, useState } from "react";

import { AllPosts } from "../components/AllPosts";

import ProfileImgContainer from "../components/ProfileImgContainer";
import RightSide from "../components/RightSide";

export default function Profile(props) {
  const [status, setStatus] = useState("");
  const [privatePosts, setPrivatePosts] = useState([]);

  // useEffect(() => {
  //   (async () => {
  //     if (props.user) {
  //       let privatePostsPromise = await fetch(
  //         "http://localhost:8080/view-private-posts"
  //       );
  //       let result = await privatePostsPromise.json();
  //       let privPosts = result.filter(
  //         (post) => post.author === props.user.nickname
  //       );

  //       setPrivatePosts(privPosts);
  //     }
  //   })();
  // }, []);

  // Update status to props.user.status.
  useEffect(() => {
    setStatus(props.user.status);
  }, [props.user.status]);

  const sendStatusToBackend = async (data) => {
    console.log(data);
    await fetch("http://localhost:8080/update-user-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
  };

  const updateUserStatus = async (ev) => {
    let buttonClicked = ev.target.getAttribute("data-type");
    if (buttonClicked === "private") {
      sendStatusToBackend({
        user: props.user.email,
        setStatus: "private",
      });
      setStatus("private");
    } else if (buttonClicked === "public") {
      // update on backend if user is not already public
      sendStatusToBackend({
        user: props.user.email,
        setStatus: "public",
      });
      setStatus("public");
    }
  };

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
      <div className="formContainer">
        <div className="smallAvatar">
          <img src={props.avatar} alt="profile photo" />
        </div>
        <div className="profile-page-title">{props.name}'s Posts</div>
      </div>

      {/* If my profile */}

      {props.currentUser === undefined ? (
        <div
          id="set-public-private"
          className="privacyButtons"
          style={{
            width: "100%",
            backgroundColor: "white",
            justifyContent: "space-evenly",
            alignItems: "center",
          }}
        >
          {/* currentUser is not passed to profile when redirecting to myProfile */}
          <>
            <button
              className="postType"
              onClick={updateUserStatus}
              data-type="private"
              disabled={status === "private" ? true : false}
              style={{
                backgroundColor:
                  status === "private"
                    ? "rgba(129, 25, 41, 0.55)"
                    : "rgb(148, 28, 47)",
              }}
            >
              Set Private
            </button>
            <button
              className="postType"
              onClick={updateUserStatus}
              data-type="public"
              disabled={status === "public" ? true : false}
              style={{
                backgroundColor:
                  status === "public"
                    ? "rgba(129, 25, 41, 0.55)"
                    : "rgb(148, 28, 47)",
              }}
            >
              Set Public
            </button>
          </>
        </div>
      ) : (
        <div
          id="set-public-private"
          className="privacyButtons"
          style={{ width: "100%", backgroundColor: "rgba(250, 250, 250, 0.5)" }}
        ></div>
      )}

      <AllPosts user={props.user} privatePosts={privatePosts} />
      <RightSide openConnection={props.openConnection} fetchRequestData={props.fetchRequestData}  />
    </div>
  );
}
