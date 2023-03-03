import React, { useState, useEffect } from "react"
import { AddUserToGroupButton } from "./AddUserToGroup"
import { AddGroupPost } from "./CreateGroupPostForm"
import { GroupPost } from "./GroupPost"

export const GroupButton = (groupInfo) => {
    const [visible, setVisible] = useState(false)
    const [groupPosts, setGroupPosts] = useState([])
    const [loaded, setLoaded] = useState(false)
    const [user, setUser] = useState('')
    const [openMembers, setOpenMembers] = useState(false)
    const [emptyPosts, setEmptyPosts] = useState("")
    const groupId = groupInfo["group"]["group-id"]
    const admin = groupInfo["group"]["admin"]

    useEffect(() => {
        fetch("http://localhost:8080/api/user")
            .then(response => response.json())
            .then(response => {
                setUser(response["nickname"])
            })
    }, [visible])

    const openForm = () => {
        setVisible((prev) => !prev)
        fetch("http://localhost:8080/get-group-posts", {
            method: "POST",
            headers: {
                'Content-Type': "application/json"
            },
            body: groupId,
        })
            .then(response => response.json())
            .then(response => {
                console.log({ response })
                if (response.length > 0) {
                    setGroupPosts(response)
                } else {
                    setEmptyPosts("Be the First to Send A Post")
                }
                setLoaded(true)
            })
    };

    const closeForm = () => {
        setVisible((prev) => !prev)
    };

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
                return (Math.round((n / ranges[i].divider) * 10) / 10).toString() + ranges[i].suffix;
            }
        }
        return n.toString();
    }

    const handleBrokenAuthImage = (source) => {
        if (source != "") {
            return source
        } else {
            return "https://www.transparentpng.com/thumb/user/gray-user-profile-icon-png-fP8Q1P.png"
        }
    }

    const getAllGroupPosts = (response) => {
        console.log("added group post", response)
        setGroupPosts(response)
    }

    const handleEditPost = (edited) => {
        console.log("edited post", { edited })
        setGroupPosts(prevPosts => {
            const index = prevPosts.findIndex(post => post["post-id"] === edited["post-id"])
            console.log({ index })
            if (index === -1) {
                return prevPosts
            }
            const newPost = [...prevPosts]
            edited["post-likes"] = formatNumber(edited["post-likes"])
            edited["post-dislikes"] = formatNumber(edited["post-dislikes"])
            newPost[index] = edited
            return newPost
        })
    }

    const handleDeletePost = (deletePost) => {
        const updatedPosts = groupPosts.filter((post) => post["post-id"] !== deletePost);
        setGroupPosts(updatedPosts);
    }

    const openMembersForm = () => {
        setOpenMembers((prev) => !prev)
    }
    return (
        <>
            {visible &&
                <div className="comment-view-container">
                    <div className="comment-view">
                        <div className="comment-post-header">
                            <button className="close-button" type="button" onClick={closeForm}>
                                <span>&times;</span>
                            </button>
                            <div className="group-header">
                                <img src={handleBrokenAuthImage(groupInfo["group"]["group-avatar"])} />
                                <h1>{groupInfo["group"]["group-name"]}</h1>
                            </div>
                            {admin === user &&
                                <button type="button" className="add-comment-button" onClick={openMembersForm}>Members</button>
                            }
                            <AddGroupPost id={groupId} onSubmit={getAllGroupPosts} />
                        </div>
                        <div className="group-post-container">
                            {groupPosts.length > 0 &&
                                <>
                                    {loaded && groupPosts.reverse().map((groupPost, index) => (
                                        <div key={index} className="post">
                                            <GroupPost post={groupPost} onEdit={handleEditPost} onDelete={handleDeletePost} />
                                        </div>
                                    ))}
                                    {!loaded &&
                                        <div className="comments-loader-container">
                                            <img src="http://superstorefinder.net/support/wp-content/uploads/2018/01/orange_circles.gif" className="post-loader" />
                                        </div>
                                    }
                                </>
                            }
                            {groupPosts.length === 0 &&
                                <h1 className="no-post">{emptyPosts}</h1>
                            }
                        </div>
                    </div>
                    {openMembers &&
                        <>
                            <AddUserToGroupButton group={groupInfo} user={user} />
                        </>
                    }
                </div>
            }
            <button key={groupInfo["index"]} type="button" className="group-post-button" onClick={openForm} >
                <img src={handleBrokenAuthImage(groupInfo["group"]["group-avatar"])} />
                <p className="group-post-button-name">{groupInfo["group"]["group-name"]}</p>
            </button>
        </>
    )
}
