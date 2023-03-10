import React, { useState, useEffect, useRef } from "react"
import { AddUserToGroupButton } from "./AddUserToGroup"
import { AddGroupPost } from "./CreateGroupPostForm"
import { EventGroupButton } from "./GroupEventButton"
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
    const conn = useRef(null)
    const [emptyPosts, setEmptyPosts] = useState("")
    const groupId = groupInfo["group"]["group-id"]
    const admin = groupInfo["group"]["admin"]
    const [postAdded, setPostAdded] = useState(false)
    const [events, setEvents] = useState(false)
    const [eventsArr, setEventsArr] = useState([])


    useEffect(() => {
        fetch("http://localhost:8080/api/user")
            .then(response => response.json())
            .then(response => {
                setUser(response["nickname"])
            })
    }, [visible])

    useEffect(() => {
        const fetchData = async () => {
            const receivedResponse = await fetch("http://localhost:8080/get-group-posts", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: (groupId)
            })
            const response2 = await receivedResponse.json()
            if (response2.length > 0) {
                setGroupPosts(response2)
            } else {
                setEmptyPosts("Be the First to Send A Post")
            }
            setLoaded(true)
            return response2
        }
        if (visible) {
            fetchData().then(() => {
                conn.current = new WebSocket("ws://" + document.location.host + "/ws/group")
                console.log(conn.current)
                conn.current.onmessage = (evt) => {
                    evt.preventDefault()
                    let incomingGroupPost = JSON.parse(evt.data)
                    console.log({ incomingGroupPost })
                    setGroupPosts(post => {
                        if (post !== null) {
                            return [...post, incomingGroupPost]
                        } else {
                            return [incomingGroupPost]
                        }
                    })
                    // setGroupPosts(response)
                }

            })

            return () => {
                console.log('user close group')
                conn.current.close(1000, "user closed group.")
            }
        }
    }, [visible])

    const openForm = () => {
        setVisible((prev) => !prev)
    };

    const closeForm = () => {
        setVisible((prev) => !prev)
        if (postAdded) {
            groupInfo["addedPost"](groupPosts)
        }
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
        setEvents(false)
    }

    const AddMembersForm = () => {
        setAddMembers((prev) => !prev)
        setRemoveMembers(false)
        setDescriptionBox(false)
        setEvents(false)
    }

    const RemoveMembersForm = () => {
        setRemoveMembers((prev) => !prev)
        setAddMembers(false)
        setDescriptionBox(false)
        setEvents(false)
    }

    const showEvents = () => {
        setEvents((prev) => {
            console.log({ prev })
            if (prev == false) {

                const getGroupEvents = async () => {
                    // Fetch users from "all users" api
                    const getGroupEventsPromise = await fetch("http://localhost:8080/get-group-events", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: groupId
                    });
                    const newData = await getGroupEventsPromise.json();
                    if (newData !== null && newData.length != 0)
                        console.log({ newData })
                    newData.sort((a, b) => a["event-time"] - (b["event-time"]))
                    setEventsArr(newData)
                };
                getGroupEvents()
            }
            return !prev
        })
        setAddMembers(false)
        setDescriptionBox(false)
        setRemoveMembers(false)
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
                                    </>
                                }
                                <button type="button" className="add-comment-button" onClick={AddMembersForm}>+</button>
                                <button type="button" className="add-comment-button" onClick={showDescriptionBox}>Description</button>
                                <button type="button" className="add-comment-button" onClick={showEvents}>Events</button>
                                <AddGroupPost id={groupId} socket={conn.current} added={setPostAdded} />
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
                    {events &&
                        <>
                            <EventGroupButton id={groupId} events={eventsArr} />
                        </>

                    }
                </div>
            }
            <button type="button" className="group-post-button" onClick={openForm} >
                <img src={handleBrokenAuthImage(groupInfo["group"]["group-avatar"])} />
                <p className="group-post-button-name">{groupInfo["group"]["group-name"]}</p>
            </button>
        </>
    )
}
