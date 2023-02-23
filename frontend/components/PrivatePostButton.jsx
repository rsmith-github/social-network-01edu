import React from "react"

export const PrivatePostButton = (action) => {
    const getFriendsPosts = () => {
        fetch('http://localhost:8080/get-friends')
            .then(response => response.json())
            .then(data => action["privatePost"](data))
    }
    return (
        <>
            <button className="postType" onClick={getFriendsPosts}>Private Post</button>
        </>
    )
}