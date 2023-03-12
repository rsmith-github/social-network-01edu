import React, { useState } from "react"
export const DisLikeGroupPostButton = (likeInfo) => {
    const [errorMes, setErrorMes] = useState("")
    const postId = likeInfo.id

    const handleDislikeButton = (evt) => {
        evt.preventDefault()
        const values = { "post-id": postId, "type": "like/dislike", "like": "d" }
        console.log(values)
        fetch("http://localhost:8080/group-post-interactions", {
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
            <div className="dislike-post-container">
                <p>{likeInfo.num}</p>
                <button type="button" onClick={handleDislikeButton} >
                    {likeInfo.disliked ? (
                        <i className="fa fa-thumbs-down disliked"></i>
                    ) : (
                        <i className="fa fa-thumbs-down"></i>
                    )}
                </button>
            </div >
        </>
    )
}