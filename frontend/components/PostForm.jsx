import React, { useState, useEffect } from "react"
import { CreatePost } from "./CreatePostForm"
import { DeleteButton } from "./DeletePostButton"
import { EditButton } from "./EditPostButton"
import { DisLikeButton, LikeButton } from "./LikesDislikesButton"

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
    setPosts(response)
  }

  const dateFormat = (strDate) => {
    let date = new Date(strDate)
    let dd = date.getDate();
    let mm = date.getMonth() + 1;
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

  const handleBrokenAuthImage = (source) => {
    if (source != "") {
      return source
    } else {
      return "https://www.transparentpng.com/thumb/user/gray-user-profile-icon-png-fP8Q1P.png"
    }
  }

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

  const handleEditPost = (edited) => {
    console.log("edited post", { edited })
    setPosts(prevPosts => {
      const index = prevPosts.findIndex(post => post["post-id"] === edited["post-id"])
      console.log({ index })
      if (index === -1) {
        return prevPosts
      }
      const newPost = [...prevPosts]
      edited["post-likes"] = formatNumber(edited["post-likes"])
      edited["post-dislikes"] = formatNumber(edited["post-dislikes"])
      newPost[index] = edited
      return newPost.reverse()
    })
  }

  const handleDeletePost = (deletePost) => {
    const updatedPosts = posts.filter((post) => post["post-id"] !== deletePost);
    setPosts(updatedPosts.reverse());
  }

  return (
    <>
      <div className="formContainer">
        <div className="smallAvatar">
          <img src={props.avatar} alt="profile photo" />
        </div>

    
        
          
    

        
    
    @@ -74,84 +102,69 @@ export default function PostForm(props) {
  
        <div className="privacyButtons">
          <button className="postType">Public Post</button>
          <button className="postType">Private Post</button>
        </div>
      </div>
      <div className="post-container">


        {loaded && posts.reverse().map((post, index) => (
          <div key={index} className="post">
            <div className="post-header">
              <div className="post-author-container">
                <img src={handleBrokenAuthImage(post["author-img"])} />
                <p>{post["author"]}</p>
              </div>
              <div className="post-time-container">
                <p>{dateFormat(post["post-time"])}</p>
              </div>
            </div>

            {post["post-image"] &&
              <div className="post-image-container">
                <img src={post["post-image"]} />
              </div>
            }

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
              <LikeButton id={post["post-id"]} num={formatNumber(post["post-likes"])} func={handleEditPost} />
              <DisLikeButton id={post["post-id"]} num={formatNumber(post["post-dislikes"])} func={handleEditPost} />
              <button type="button" value={post["post-id"]}><img src="../../public/assets/img/comment.png" /></button>
              {post["post-author"] &&
                <>
                  <EditButton post={post} func={handleEditPost} />
                  <DeleteButton id={post["post-id"]} func={handleDeletePost} />
                </>
              }
            </div>

          </div>
        ))}
        {!loaded &&
          <div className="post-loader-container">
            <img src="http://superstorefinder.net/support/wp-content/uploads/2018/01/orange_circles.gif" className="post-loader" />
          </div>
        }
      </div>
      <CreatePost onSubmit={getAllPost} />
    </>
  );
}