import React, { useState } from "react"

export const DeleteGroupPostCommentButton = (deletedPost) => {
    const [visible, setVisible] = useState(false)
    const [errorMes, setErrorMes] = useState("")
    const commentId = deletedPost.id

    const openDeleteCommentForm = () => {
        setVisible((prev) => !prev)
    };

    const closeDeleteCommentForm = () => {
        setVisible((prev) => !prev)
    };

    const handleDeleteCommentSubmit = (evt) => {
        evt.preventDefault()
        const values = { "comment-id": commentId, "type": "delete" }
        console.log(values)
        fetch("http://localhost:8080/group-post-comment-interaction", {
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
                    setTimeout(() => {
                        setErrorMes("")
                    }, 5000)
                } else {
                    deletedPost["func"](commentId)
                    closeDeleteCommentForm()
                }
            })
    }

    return (
        <>
            {visible &&
                <div className="delete-post-container">
                    <div className="delete-post-form">
                        <h1>Are You Sure You Want to Delete Your Comment</h1>
                        <div className="delete-confirmation-container">
                            <button type="button" className="delete-post-confirmed" onClick={handleDeleteCommentSubmit}>Yes</button>
                            <button type="button" className="delete-post-unconfirmed" onClick={closeDeleteCommentForm}>No</button>
                        </div>
                    </div>
                </div>
            }
            <button type="button" onClick={openDeleteCommentForm}>
                <img src="../../public/assets/img/delete.png" />
            </button>
        </>
    )
}