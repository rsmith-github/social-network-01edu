import React from "react";

// Post form in the center
export default function PostForm(props) {
  return (
    <div className="formContainer">
      {/* <form action="">
        <textarea name="post" id="" cols="40" rows="5"></textarea>
      </form> */}
      <div className="smallAvatar">
        <img src={props.avatar} alt="profile photo" />
      </div>
      <div className="privacyButtons">
        <button className="postType">Public Post</button>
        <button className="postType">Private Post</button>
      </div>
    </div>
  );
}
