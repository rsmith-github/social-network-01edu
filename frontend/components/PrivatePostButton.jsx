import React from "react"

export const PrivatePostButton = (action) => {
    const getFriendsPosts = () => {
        console.log("private post pressed")
        fetch('http://localhost:8080/view-private-posts')
            .then(response => response.json())
            .then(data => {
                console.log(data)
                action["allPost"](data)
                action["private"](true)
            })
    }
    return (
        <>
            <button className="postType" onClick={getFriendsPosts}>Private Posts</button>
        </>
    )
}