import React from "react";

export default function PublicProfiles(props) {
  console.log(props.users);
  return (
    <div id="public-profiles">
      {props.users ? (
        props.users.map((user) => {
          return (
            <div className="grid-item">
              <div className="smallAvatar">
                <img src={user.avatar} alt="profile photo" />
              </div>
              <span>
                {user.firstname} {user.lastname}
              </span>
            </div>
          );
        })
      ) : (
        <div>Nothing to see here...</div>
      )}
    </div>
  );
}
