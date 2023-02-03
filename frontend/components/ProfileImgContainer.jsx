import React from "react";
import { Link } from "react-router-dom";

// Component that contains image, followers etc.
export default function ProfileImgContainer(props) {
  return (
    <div className="profileImgContainer">
      {props.name ? (
        <div className="profileImgParent">
          <div className="profileImgBg"></div>
          <img className="profileImg" src={props.avatar} alt="" />
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
              <span className="count">34</span>
            </div>
          </div>
          <hr className="break" />

          <div className="followerDiv">
            <div>
              <span className="followerFollowing">Followers</span>
            </div>
            <div>
              <span className="count">155</span>
            </div>
          </div>
          <hr className="break" />
          <div className="followerDiv">
            <Link
              to="/profile"
              style={{ textDecoration: "none", marginBottom: "15px" }}
            >
              <span className="redText">Open Profile</span>
            </Link>
          </div>
        </div>
      ) : (
        <div> loading... </div>
      )}
    </div>
  );
}
