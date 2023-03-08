import React, { useState, useEffect } from "react"
import { AddUserToGroupButton } from "./AddUserToGroup"
import { AddGroupPost } from "./CreateGroupPostForm"
import { GroupPost } from "./GroupPost"
import { RemoveUserToGroupButton } from "./RemoveUserToGroup"

export const GroupButton = (groupInfo) => {
    const [visible, setVisible] = useState(false)
    const [groupPosts, setGroupPosts] = useState([])
    const [loaded, setLoaded] = useState(false)
    const [user, setUser] = useState('')
    const [AddMembers, setAddMembers] = useState(false)
    const [RemoveMembers, setRemoveMembers] = useState(false)
    const [groupDescription, setGroupDescription] = useState('')
    const [descriptionBox, setDescriptionBox] = useState(false)
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
        setGroupPosts(response)
        groupInfo["addedPost"](response)
    }

    const handleEditPost = (edited) => {
        console.log("edited post", { edited })
        setGroupPosts(prevPosts => {
            const index = prevPosts.findIndex(post => post["post-id"] === edited["post-id"])
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

    const showDescriptionBox = () => {
        setDescriptionBox((prev) => !prev)
        setRemoveMembers(false)
        setAddMembers(false)
    }

    const AddMembersForm = () => {
        setAddMembers((prev) => !prev)
        setRemoveMembers(false)
        setDescriptionBox(false)
    }

    const RemoveMembersForm = () => {
        setRemoveMembers((prev) => !prev)
        setAddMembers(false)
        setDescriptionBox(false)
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
                            <div className="edit-members-button-container" style={{ marginTop: '10px' }}>
                                {admin === user &&
                                    <>
                                        <button type="button" className="add-comment-button" onClick={RemoveMembersForm}>-</button>
                                        <button type="button" className="add-comment-button" onClick={AddMembersForm}>+</button>
                                    </>
                                }
                                <button type="button" className="add-comment-button" onClick={showDescriptionBox}>Description</button>
                                <AddGroupPost id={groupId} onSubmit={getAllGroupPosts} />
                            </div>
                        </div>
                        <div className="group-post-container" id={groupId}>
                            {groupPosts.length > 0 &&
                                <>
                                    {loaded && groupPosts.slice().reverse().map((groupPost, index) => (
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
                    {descriptionBox && (
                        <div className="group-members-form" >
                            {groupDescription ? (
                                <>
                                    {groupDescription}
                                </>

                            ) : (
                                <>No Description Given</>
                            )}
                        </div>
                    )}
                    {AddMembers &&
                        <>
                            <AddUserToGroupButton group={groupInfo} user={user} socket={groupInfo.socket} onClose={AddMembersForm} />
                        </>
                    }
                    {RemoveMembers &&
                        <>
                            <RemoveUserToGroupButton group={groupInfo} user={user} socket={groupInfo.socket} onClose={RemoveMembersForm} />
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
