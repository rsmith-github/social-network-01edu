import React from "react"

export const PublicPostButton = (action) => {
    const getAllPosts = () => {
        console.log("public post button")
        fetch('http://localhost:8080/view-public-posts')
            .then(response => response.json())
            .then(data => {
                console.log(data)
                action["allPost"](data)
                action["private"](false)
            })
    }
    return (
        <>
            <button className="postType" onClick={getAllPosts}>Public Posts</button>
        </>
    )
}