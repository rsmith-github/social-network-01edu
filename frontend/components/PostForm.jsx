import React, { useState, useEffect } from "react";
import { CreatePost } from "./CreatePostForm";
import { PublicPostButton } from "./PublicPostButton";
import { PrivatePostButton } from "./PrivatePostButton";

import { AllPosts } from "./AllPosts";

// Post form in the center, filtering private and public posts.
export default function PostForm(props) {
  const [posts, setPosts] = useState([])
  const [loaded, setLoaded]=useState(false)
  const [privatePost, setPrivatePost] = useState(false)

  useEffect(() => {
    if (!loaded) {
      fetch('http://localhost:8080/view-public-posts')
        .then(response => response.json())
        .then(data => {
          setPosts([...data])
          setLoaded(true)
        })
    }
  }, [loaded]);

  const getAllPost = (response) => {
    setPosts(response);
  };

  const handleBrokenAuthImage = (source) => {
    if (source != "") {
      return source
    } else {
      return "https://www.transparentpng.com/thumb/user/gray-user-profile-icon-png-fP8Q1P.png"
    }
  }

  return (
    <>
      <div className="formContainer">
        <div className="smallAvatar">
          <img src={handleBrokenAuthImage(props.avatar)} alt="profile photo" />
        </div>
        <div className="privacyButtons">
          <PublicPostButton allPost={getAllPost} private={setPrivatePost} />
          <PrivatePostButton allPost={getAllPost} private={setPrivatePost} />
        </div>
      </div>

      <AllPosts posts={posts} />
      <CreatePost onSubmit={getAllPost} private={privatePost} />
    </>
  );
}
