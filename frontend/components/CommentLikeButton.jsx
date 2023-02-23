import React, { useState } from "react"

export const LikeCommentButton = (likeInfo) => {
    const [errorMes, setErrorMes] = useState("")
    const commentId = likeInfo.id

    const handleLikeButton = (evt) => {
        evt.preventDefault()
        const values = { "comment-id": commentId, "type": "like/dislike", "like": "l" }
        console.log(values)
        fetch("http://localhost:8080/comment-interactions", {
            method: "POST",
            headers: {
                'Content-Type': "multipart/form-data"
            },
            body: JSON.stringify(values),
        })
            .then(response => response.json())
            // return array of posts and send to the top.
            .then(response => {
                console.log(response)
                if (response["error"] != "") {
                    setErrorMes(response["error"])
                } else {
                    likeInfo["func"](response)
                }
            })
    }

    return (
        <>
            {errorMes &&
                <>
                    <p className="like-dislike-error-message">{errorMes}</p>
                    {setTimeout(() => setErrorMes(""), 1000)}
                </>
            }
            <div className="like-post-container">
                <p>{likeInfo.num}</p>
                <button type="button" onClick={handleLikeButton}>
                    {/* <img src="../../public/assets/img/like.png" /> */}
                    {likeInfo.liked ? (
                        <i className="fa fa-thumbs-up liked"></i>
                    ) : (
                        <i className="fa fa-thumbs-up"></i>
                    )}
                </button>
            </div>
        </>
    )
}