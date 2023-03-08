import React, { useState, useEffect } from "react"
import { CreatePost } from "./CreatePostForm"

import { PublicPostButton } from "./PublicPostButton"
import { PrivatePostButton } from "./PrivatePostButton"
import { Post } from "./Post"

// Post form in the center
export default function PostForm(props) {
  const [posts, setPosts] = useState([])
  const [loaded, setLoaded] = useState(false)
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
  }, [loaded])

  var ranges = [
    { divider: 1e18, suffix: 'E' },
    { divider: 1e15, suffix: 'P' },
    { divider: 1e12, suffix: 'T' },
    { divider: 1e9, suffix: 'G' },
    { divider: 1e6, suffix: 'M' },
    { divider: 1e3, suffix: 'k' }
  ];

  function formatNumber(n) {
    for (var i = 0; i < ranges.length; i++) {
      if (n >= ranges[i].divider) {
        return (Math.round((n / ranges[i].divider) * 10) / 10).toString() + ranges[i].suffix;
      }
    }
    return n.toString();
  }

  const getAllPost = (response) => {
    setPosts(response)
  }

  const handleEditPost = (edited) => {
    setPosts(prevPosts => {
      const index = prevPosts.findIndex(post => post["post-id"] === edited["post-id"])
      if (index === -1) {
        return prevPosts
      }
      const newPost = [...prevPosts]
      edited["post-likes"] = formatNumber(edited["post-likes"])
      edited["post-dislikes"] = formatNumber(edited["post-dislikes"])
      newPost[index] = edited
      return newPost
    })
  }

  const handleDeletePost = (deletePost) => {
    const updatedPosts = posts.filter((post) => post["post-id"] !== deletePost);
    setPosts(updatedPosts);
  }

  return (
    <>
      <div className="formContainer">
        <div className="smallAvatar">
          <img src={props.avatar} alt="profile photo" />
        </div>
        <div className="privacyButtons">
          <PublicPostButton allPost={getAllPost} private={setPrivatePost} />
          <PrivatePostButton allPost={getAllPost} private={setPrivatePost} />
        </div>
      </div>
      <div className="post-container">


        {loaded && posts.slice().reverse().map((post, index) => (
          <div key={index} className="post">
            <Post post={post} onEdit={handleEditPost} onDelete={handleDeletePost} />
          </div>
        ))}
        {!loaded &&
          <div className="post-loader-container">
            <img src="http://superstorefinder.net/support/wp-content/uploads/2018/01/orange_circles.gif" className="post-loader" />
          </div>
        }
      </div>
      <CreatePost onSubmit={getAllPost} private={privatePost} />
    </>
  );
}
