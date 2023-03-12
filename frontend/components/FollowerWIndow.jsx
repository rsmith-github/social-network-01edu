import React, { useEffect } from "react";

export default function FollowerWindow(props) {
  return (
    <div>
      {(props.followers && props.followers.length > 0) ||
      (props.following && props.following.length > 0) ? (
        <div className="followersWindowParent">
          <div
            className="followersWindow"
            style={{
              top: "300px",
              padding: "10px 20px 10px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              
              <i id="close-follower-window"
                style={{
                  fontWeight: "bold",
                  fontSize: "20px",
                }}
                onClick={props.closeFollowersWindow}
              >
                x
              </i>
            </div>
            {props.followers
              ? props.followers.map((usr) => {
                  return <div key={usr}>{usr}</div>;
                })
              : null}
            {props.following
              ? props.following.map((usr) => {
                  return <div key={usr}>{usr}</div>;
                })
              : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
