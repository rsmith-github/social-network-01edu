import React, { useState, useEffect } from "react"
import { CreatePost } from "./CreatePostForm"

// Post form in the center
export default function PostForm(props) {
  const [posts, setPosts] = useState([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    if (!loaded) {
      fetch('http://localhost:8080/create-post')
        .then(response => response.json())
        .then(data => {
          console.log(data)
          setPosts(data)
          setLoaded(true)
        })
    }
  }, [loaded])
  const getAllPost = (response) => {
    console.log(response)
    setPosts(response)
  }

  const dateFormat = (strDate) => {
    let date = new Date(strDate)
    let dd = date.getDate();
    let mm = date.getMonth() + 1; //January is 0!
    let yyyy = date.getFullYear().toString().substr(-2);
    if (dd < 10) {
      dd = '0' + dd;
    }
    if (mm < 10) {
      mm = '0' + mm;
    }
    let hh = date.getHours()
    let min = date.getMinutes()
    date = dd + "/" + mm + "/" + yyyy + " " + hh + ":" + min;

    return date.toString();
  }

  const handleEditPost = (edited) => {
    const updatedPosts = posts.map(post => {
      if (post["post-id"] === post["post-id"]) {
        return { ...post, edited };
      }
      return post;
    });
    setPosts(updatedPosts);
  }
  return (
    <>
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
      <div className="post-container">
        {posts.reverse().map((post, index) => (
          <div key={index} className="post">
            <div className="post-header">
              <div className="post-author-container">
                <img src={post["author-img"]} />
                <p>{post["author"]}</p>
              </div>
              <div className="post-time-container">
                <p>{dateFormat(post["post-time"])}</p>
              </div>
            </div>
            {post["post-image"] &&
              <div className="post-image-container">
                <img src={post["post-image"]} />
              </div>}
            {post["post-text-content"] &&
              <div className="post-text-container">
                <p>{post["post-text-content"]}</p>
              </div>
            }
            {post["post-threads"] &&
              <div className="post-thread-container">
                {post["post-threads"].split("#").map((thread, i) => {
                  if (thread != "") {
                    if (i < post["post-threads"].split("#").length - 1) {
                      return <p>#{thread.slice(0, - 1)}</p>
                    } else {
                      return <p>#{thread}</p>
                    }
                  }

                })}
              </div>
            }
            <div className="post-interactions">
              <div className="like-post-container">
                <p>{post["post-likes"]}</p>
                <button type="button" value={post["post-id"]}>
                  <img src="../../public/assets/img/like.png" />
                </button>
              </div>
              <div className="dislike-post-container">
                <p>{post["post-dislikes"]}</p>
                <button type="button" value={post["post-id"]}>
                  <img src="../../public/assets/img/dislike.png" />
                </button>
              </div>
              {/* Create an edit button function with post-id as in input which returns a button and  */}
              <button type="button" value={post["post-id"]}><img src="../../public/assets/img/comment.png" /></button>
              {post["post-author"] &&
                <>
                  <EditButton post={post} func={handleEditPost} />
                  {/* Create an edit button function with post-id as in input which returns a button and  */}
                  <button type="button" value={post["post-id"]}><img src="../../public/assets/img/delete.png" /></button>
                </>
              }
            </div>

          </div>
        ))}
      </div>
      <CreatePost onSubmit={getAllPost} />
    </>
  );
}