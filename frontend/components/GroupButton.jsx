import React, { useState, useEffect } from "react"

export const GroupButton = (groupInfo) => {
    const [visible, setVisible] = useState(false)
    // const [groupPost, setGroupPosts]=useState([])
    // const [loaded, setLoaded] = useState(false)
    const groupId = groupInfo["group"]["group-id"]
    console.log(groupId)

    // get all group posts
    // useEffect(() => {
    //     fetch('http://localhost:8080/api/user')
    //         .then(response => response.json())
    //         .then(data => {

    //             setUser(data["nickname"])
    //         })
    // }, [visible])

    const openForm = () => {
        setVisible((prev) => !prev)
    };

    // const closeForm = () => {
    //     setVisible((prev) => !prev)
    // };

    const handleBrokenAuthImage = (source) => {
        if (source != "") {
            return source
        } else {
            return "https://www.transparentpng.com/thumb/user/gray-user-profile-icon-png-fP8Q1P.png"
        }
    }

    return (
        <button key={groupInfo["index"]} type="button" className="group-post-button" onClick={openForm} >
            <img src={handleBrokenAuthImage(groupInfo["group"]["group-avatar"])} />
            <p className="group-post-button-name">{groupInfo["group"]["group-name"]}</p>
        </button>
    )
}
