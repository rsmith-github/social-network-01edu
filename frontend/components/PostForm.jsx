import React, { useState, useEffect } from "react";
import { CreatePost } from "./CreatePostForm";
import { PublicPostButton } from "./PublicPostButton";
import { PrivatePostButton } from "./PrivatePostButton";

import { AllPosts } from "./AllPosts";

// Post form in the center
export default function PostForm(props) {
  const [posts, setPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      fetch("http://localhost:8080/create-post")
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setPosts(data);
          setLoaded(true);
        });
    }
  }, [loaded]);

  const getAllPost = (response) => {
    setPosts(response);
  };

  const handlePrivatePosts = (friendsList) => {
    const friends = friendsList;
    const updatedPosts = posts.filter((post) =>
      friends.includes(post["author"])
    );
    setPosts(updatedPosts.reverse());
  };

  return (
    <>
      <div className="formContainer">
        <div className="smallAvatar">
          <img src={props.avatar} alt="profile photo" />
        </div>
        <div className="privacyButtons">
          <PublicPostButton allPost={getAllPost} />
          <PrivatePostButton privatePost={handlePrivatePosts} />
        </div>
      </div>

      <AllPosts />
      <CreatePost onSubmit={getAllPost} />
    </>
  );
}
