import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import Swal from "sweetalert2";

// Component that contains image, followers etc.
export default function ProfileImgContainer(props) {
  // Check if we are at other user's profile. If so, show follow button instead of my profile button.
  const otherUser = window.location.href.split("/").at(-1);

  if (props.user.status === "private"){
    (async () => {
      const response = await fetch("http://localhost:8080/api/followers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          follower: props.currentUser ? props.currentUser.email : null,
          followee: props.user.email,
        }),
      });

      let result = await response.json();

      // if (result === null) {
      // } else {
      //   setIsFollowing(true);
      // }
      // The above is the same as:
      setIsFollowing(result !== null);
      return 
    })();
  }

  // Variable to check following status. Set to true if user presses follow or on refreshing the page.
  const [isFollowing, setIsFollowing] = useState(false);

  // Get all the followers of the user rendered on component.
  useEffect(() => {
    (async () => {
      const response = await fetch("http://localhost:8080/api/followers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          follower: props.currentUser ? props.currentUser.email : null,
          followee: props.user.email,
        }),
      });

      let result = await response.json();

      // if (result === null) {
      // } else {
      //   setIsFollowing(true);
      // }
      // The above is the same as:
      setIsFollowing(result !== null);
    })();
  }, []);

  // Follow button handler
  const followHandler = () => {
    let newIsFollowing = !isFollowing;
    setIsFollowing(newIsFollowing);

    //if the user is private then wait for request to be accepted, and set IsFollowing back to false.
    if(props.user.status === "private" && newIsFollowing === true){
      setIsFollowing(!newIsFollowing)
    }
    
    let follow = JSON.stringify({
      followRequest: props.currentUser.email,
      toFollow: props.user.email,
      isFollowing: newIsFollowing,
      followers: props.user.followers,
    });
    if (newIsFollowing === false){
      follow = JSON.stringify({
        followRequest: props.currentUser.email,
        toFollow: props.user.email,
        isFollowing: newIsFollowing,
        followers: props.user.followers,
        //send followRequest-accepted:true so it goes to the else condition in client's followMessage switch case.
        "followRequest-accepted":true,
      });
    }
    props.socket.send(follow);
    props.fetchUsersData();
  };

  return (
    <div className="profileImgContainer">
      {props.name ? (
        <div className="profileImgParent">
          {props.avatar ? (
            <img
              className="profileImg"
              src={props.avatar}
              alt={props.user.name + "'s profile image"}
            />
          ) : (
            <img
              className="profileImg"
              src="https://www.transparentpng.com/thumb/user/gray-user-profile-icon-png-fP8Q1P.png"
              alt="No Image"
            />
          )}
          <span className="firstLast">
            {props.name} {props.user.last}
          </span>
          <p className="aboutme">{props.user.aboutme}</p>
          <hr className="break" />

          <div className="followerDiv">
            <div>
              <span className="followerFollowing">Following</span>
            </div>
            <div>
              <span className="count" id="following">
                {props.user.following}
              </span>
            </div>
          </div>
          <hr className="break" />

          <div className="followerDiv">
            <div>
              <span className="followerFollowing">Followers</span>
            </div>
            <div>
              <span className="count" id={`${props.user.email}-followers`}>
                {props.user.followers}
              </span>
            </div>
          </div>
          <hr className="break" />
          <div className="followerDiv">
            {otherUser && otherUser !== "profile" ? (
              <>
                <span>
                  <button
                    className="redText"
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      marginBottom: "0px",
                    }}
                    onClick={followHandler}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                </span>
                <hr className="break" />

                <span>
                  <button
                    className="moreInfo"
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      marginBottom: "15px",
                      fontSize: "large",
                      fontWeight: 500,
                    }}
                    onClick={() => showUserInfo(props)}
                  >
                    More Info
                  </button>
                </span>
              </>
            ) : otherUser === "profile" ? (
              <Link
                to="/"
                style={{ textDecoration: "none", marginBottom: "15px" }}
              >
                <span className="redText">Back</span>
              </Link>
            ) : (
              <Link
                to="/profile"
                style={{ textDecoration: "none", marginBottom: "15px" }}
              >
                <span className="redText">My Profile</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div> loading... </div>
      )}
    </div>
  );
}

function showUserInfo(props) {
  // Sweet Alert notification

  // e.g. [1998, 03, 13]
  const birthday = props.user.dob.split("-");
  Swal.fire({
    title: props.name,
    html:
      "<div id='name-email-dob'>" +
      `<p> <span class="bold">Email:&nbsp</span> ${props.user.email} </p>` +
      `<p> <span class="bold">Nickname:&nbsp</span> ${props.user.nickname} </p>` +
      `<p> <span class="bold">Birthday:&nbsp</span> ${
        birthday[1] + " / " + birthday[2]
      } </p>` +
      "</div>",
    icon: "info",
    confirmButtonText: "Close",
  });
}
