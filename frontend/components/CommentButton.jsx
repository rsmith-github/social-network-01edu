import React, { useState, useEffect } from "react"
import { LikeButton } from "./LikePostButton"
import { DisLikeButton } from "./DislikePostButton"
import { EditButton } from "./EditPostButton"
import { AddComment } from "./CommentForm"
import { LikeCommentButton } from "./CommentLikeButton"
import { DisLikeCommentButton } from "./CommentDislikeButton"
import { DeleteCommentButton } from "./CommentDeleteButton"

export const CommentButton = (commentInfo) => {
    const [visible, setVisible] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const [comments, setComments] = useState([])
    const postId = commentInfo.id

    const openComments = () => {
        setVisible((prev) => !prev)
        if (!loaded) {
            const values = { "post-id": postId, "type": "comments" }
            fetch("http://localhost:8080/post-interactions", {
                method: "POST",
                headers: {
                    'Content-Type': "multipart/form-data"
                },
                body: JSON.stringify(values),
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data)
                    const reversedComments = data.reverse()
                    setComments(reversedComments)
                    setTimeout(() => setLoaded(true), 1000)
                })
        }
    };

    const closeComments = () => {
        setVisible((prev) => !prev)
    };

    const dateFormat = (strDate) => {
        let date = new Date(strDate)
        let dd = date.getDate();
        let mm = date.getMonth() + 1;
        let yyyy = date.getFullYear().toString().substr(-2)
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        let hh = date.getHours()
        let min = date.getMinutes()
        date = dd + "/" + mm + "/" + yyyy + " " + hh + ":" + min
        return date.toString()
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
                return (Math.round((n / ranges[i].divider) * 10) / 10).toString() + ranges[i].suffix
            }
        }
        return n.toString()
    }

    const getAllComments = (response) => {
        let data = response["total-comments"].reverse()
        setComments(data)
        commentInfo["edit"](response["post-comment"])
    }

    const handleEditComment = (edited) => {
        console.log("edited post", { edited })
        setComments(prevComment => {
            const index = prevComment.findIndex(post => post["comment-id"] === edited["comment-id"])
            console.log({ index })
            if (index === -1) {
                return prevComment
            }
            const newComment = [...prevComment]
            edited["comment-likes"] = formatNumber(edited["comment-likes"])
            edited["comment-dislikes"] = formatNumber(edited["comment-dislikes"])
            newComment[index] = edited
            return newComment
        })
    }

    const handleDeleteComment = (deletePost) => {
        const updatedComments = comments.filter((comment) => comment["comment-id"] !== deletePost)
        setComments(updatedComments)
    }

    return (
        <>
            {visible &&
                <div className="comment-view-container">
                    <div className="comment-view">
                        <div className="comment-post-header">
                            <button className="close-button" type="button" onClick={closeComments}>
                                <span>&times;</span>
                            </button>
                            <h1>Comments</h1>
                            <AddComment id={postId} onSubmit={getAllComments} />
                        </div>
                        <div className="comment-post">
                            <div className="post-header">
                                <div className="post-author-container">
                                    <img src={handleBrokenAuthImage(commentInfo["post"]["author-img"])} />
                                    <p>{commentInfo["post"]["author"]}</p>
                                </div>
                                <div className="post-time-container">
                                    <p>{dateFormat(commentInfo["post"]["post-time"])}</p>
                                </div>
                            </div>

                            {commentInfo["post"]["post-image"] &&
                                <div className="post-image-container">
                                    <img src={commentInfo["post"]["post-image"]} />
                                </div>
                            }

                            {commentInfo["post"]["post-text-content"] &&
                                <div className="post-text-container">
                                    <p>{commentInfo["post"]["post-text-content"]}</p>
                                </div>
                            }
                            {commentInfo["post"]["post-threads"] &&
                                <div className="post-thread-container">
                                    {commentInfo["post"]["post-threads"].split("#").map((thread, i) => {
                                        if (thread != "") {
                                            if (i < commentInfo["post"]["post-threads"].split("#").length - 1) {
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
                                <LikeButton id={commentInfo["post"]["post-id"]} num={formatNumber(commentInfo["post"]["post-likes"])} func={commentInfo["edit"]} liked={commentInfo["post"]["post-liked"]} />
                                <DisLikeButton id={commentInfo["post"]["post-id"]} num={formatNumber(commentInfo["post"]["post-dislikes"])} func={commentInfo["edit"]} disliked={commentInfo["post"]["post-disliked"]} />
                                {commentInfo["post"]["post-author"] &&
                                    <>
                                        <EditButton post={commentInfo["post"]} func={commentInfo["edit"]} />
                                    </>
                                }
                            </div>
                        </div>
                        <div className="comment-container">
                            {loaded && comments.map((comment, index) => (
                                <div key={index} className="comment">
                                    <div className="comment-header">
                                        <div className="comment-author-container">
                                            <img src={handleBrokenAuthImage(comment["author-img"])} />
                                            <p>{comment["author"]}</p>
                                        </div>
                                        <div className="comment-time-container">
                                            <p>{dateFormat(comment["comment-time"])}</p>
                                        </div>
                                    </div>

                                    {comment["comment-image"] &&
                                        <div className="comment-image-container">
                                            <img src={comment["comment-image"]} />
                                        </div>
                                    }

                                    {comment["comment-text"] &&
                                        <div className="comment-text-container">
                                            <p>{comment["comment-text"]}</p>
                                        </div>
                                    }
                                    {comment["comment-threads"] &&
                                        <div className="comment-thread-container">
                                            {comment["comment-threads"].split("#").map((thread, i) => {
                                                if (thread != "") {
                                                    if (i < comment["comment-threads"].split("#").length - 1) {
                                                        return <p>#{thread.slice(0, - 1)}</p>
                                                    } else {
                                                        return <p>#{thread}</p>
                                                    }
                                                }

                                            })}
                                        </div>
                                    }


                                    <div className="comment-interactions">
                                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
                                        <LikeCommentButton id={comment["comment-id"]} num={formatNumber(comment["comment-likes"])} func={handleEditComment} liked={comment["comment-liked"]} />
                                        <DisLikeCommentButton id={comment["comment-id"]} num={formatNumber(comment["comment-dislikes"])} func={handleEditComment} disliked={comment["comment-disliked"]} />
                                        {comment["comment-author"] &&
                                            <>
                                                <DeleteCommentButton id={comment["comment-id"]} func={handleDeleteComment} />
                                            </>
                                        }
                                    </div>

                                </div>
                            ))}
                            {!loaded &&
                                <div className="comments-loader-container">
                                    <img src="http://superstorefinder.net/support/wp-content/uploads/2018/01/orange_circles.gif" className="post-loader" />
                                </div>
                            }
                        </div>
                    </div>
                </div>
            }
            <div className="comment-post-container">
                {/* {likeInfo.num} */}
                <p>{commentInfo.num}</p>
                {/* onClick={handleLikeButton} */}
                <button type="button" onClick={openComments} >
                    <img src="../../public/assets/img/comment.png" />
                </button>
            </div>
        </>
    )
}
