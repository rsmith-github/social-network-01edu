import React from "react";
import { Link, useLocation } from "react-router-dom";
import Profile from "./Profile";

import RightSide from "../components/RightSide";

export default function PublicProfiles(props) {
  const location = useLocation();
  // Get user from url
  const query = new URLSearchParams(location.search);
  const userFromUrl = query.get("user");

  //   Get user based on url query
  const getQueriedUser = (users, userFromUrl) => {
    return users.filter((user) => {
      return userFromUrl === `${user.firstname}-${user.lastname}`;
    });
  };

  const queriedUserData = getQueriedUser(props.users, userFromUrl);

  //   If user found in url, show their profile.
  if (queriedUserData.length == 1) {
    const usr = queriedUserData[0];
    return (
      <Profile
        name={usr.firstname}
        avatar={usr.avatar}
        user={{
          email: usr.email,
          last: usr.lastname,
          dob: usr.dob,
          nickname: usr.nickname,
          aboutme: usr.aboutme,
          following: usr.following,
          followers: usr.followers,
          status: usr.status,
        }}
        socket={props.socket} // socket passed down from App.jsx
        currentUser={props.user} // user that's interacting with the dom.
        fetchUsersData={props.fetchUsersData}
        update={props.update}
        setUpdate={props.setUpdate}
      />
    );
  }

  //   Otherwise show all users.
  return (
    <div id="public-profiles">
      <RightSide page={"profiles"} openConnection={props.openConnection} fetchRequestData={props.fetchRequestData} />

      {props.users ? (
        props.users.map((user) => {
          // Skip current user.
          if (user.email === props.user.email) {
            return;
          }
          return (
            <Link
              to={
                "/public-profiles?user=" + user.firstname + "-" + user.lastname
              }
              className="grid-link"
              key={user.firstname}
            >
              <div className="grid-item">
                <div>
                  <div className="smallAvatar">
                    <img src={user.avatar} alt="profile photo" />
                  </div>
                  <span className="firstlast">
                    {user.firstname} {user.lastname}
                  </span>
                </div>
                <hr className="break" />

                <p className="aboutme">{user.aboutme}</p>
              </div>
            </Link>
          );
        })
      ) : (
        <div>Nothing to see here...</div>
      )}
    </div>
  );
}
