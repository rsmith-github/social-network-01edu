import React from "react"
import { DeleteButton } from "./DeletePostButton"
import { EditButton } from "./EditPostButton"
import { DisLikeButton } from "./DislikePostButton"
import { LikeButton } from "./LikePostButton"
import { CommentButton } from "./CommentButton"

export const Post = (post) => {
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
  return (
    <>
      <div className="post-header">
        <div className="post-author-container">
          <img src={handleBrokenAuthImage(post["post"]["author-img"])} />
          <p>{post["post"]["author"]}</p>
        </div>
        <div className="post-time-container">
          <p>{dateFormat(post["post"]["post-time"])}</p>
        </div>
      </div>

      {post["post"]["post-image"] &&
        <div className="post-image-container">
          <img src={post["post"]["post-image"]} />
        </div>
      }

      {post["post"]["post-text-content"] &&
        <div className="post-text-container">
          <p>{post["post"]["post-text-content"]}</p>
        </div>
      }
      {post["post"]["post-threads"] &&
        <div className="post-thread-container">
          {post["post"]["post-threads"].split("#").map((thread, i) => {
            if (thread != "") {
              if (i < post["post"]["post-threads"].split("#").length - 1) {
                return <p>#{thread.slice(0, - 1)}</p>
              } else {
                return <p>#{thread}</p>
              }
            }

          })}
        </div>
      }


      <div className="post-interactions">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>

        <LikeButton id={post["post"]["post-id"]} num={formatNumber(post["post"]["post-likes"])} func={post["onEdit"]} liked={post["post"]["post-liked"]} />
        <DisLikeButton id={post["post"]["post-id"]} num={formatNumber(post["post"]["post-dislikes"])} func={post["onEdit"]} disliked={post["post"]["post-disliked"]} />
        <CommentButton id={post["post"]["post-id"]} post={post["post"]} num={formatNumber(post["post"]["post-comments"])} edit={post["onEdit"]} delete={post["onDelete"]} />
        {post["post"]["post-author"] &&
          <>
            <EditButton post={post["post"]} func={post["onEdit"]} />
            <DeleteButton id={post["post"]["post-id"]} func={post["onDelete"]} />
          </>
        }
      </div>

    </>
  )
}