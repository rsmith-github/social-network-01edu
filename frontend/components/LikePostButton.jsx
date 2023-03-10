import React, { useState } from "react"

export const LikeButton = (likeInfo) => {
    const [errorMes, setErrorMes] = useState("")
    const postId = likeInfo.id

    const handleLikeButton = (evt) => {
        evt.preventDefault()
        const values = { "post-id": postId, "type": "like/dislike", "like": "l" }
        console.log(values)
        fetch("http://localhost:8080/post-interactions", {
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
                    <p className="error-message">{errorMes}</p>
                    {setTimeout(() => setErrorMes(""), 1000)}
                </>
            }
            <div className="like-post-container">
                <p>{likeInfo.num}</p>
                <button type="button" onClick={handleLikeButton}>
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