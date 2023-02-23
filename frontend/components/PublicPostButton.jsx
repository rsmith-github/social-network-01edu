import React from "react"

export const PublicPostButton = (action) => {
    const getAllPosts = () => {
        console.log("pressed")
        fetch('http://localhost:8080/create-post')
            .then(response => response.json())
            .then(data => {
                console.log(data)
                action["allPost"](data)

            })
    }
    return (
        <>
            <button className="postType" onClick={getAllPosts}>Public Post</button>
        </>
    )
}