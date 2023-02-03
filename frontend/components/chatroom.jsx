import React, { useState, useEffect } from "react"

export const CreateChat = () => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isPrivate, setIsPrivate] = useState(false)
    const friendsArr = [
        { name: "j", selected: false },
        { name: "a", selected: false },
        { name: "m", selected: false },
        { name: "k", selected: false },
    ]
    const [friends, setFriends] = useState(friendsArr)

    // fetch to get the names of followers to create chat and add selected key and set to false
    //    const [friends, setFriends] = useState([]);
    // useEffect(()=>{
    //     fetch('/api/friends')
    //     .then(response => response.json())
    //     .then(data => setFriends(data))
    // },[])

    // send info to golang
    const handleGroupChatSubmit = (evt) => {
        evt.preventDefault()
        const data = new FormData(evt.target);
        let values = Object.fromEntries(data.entries())
        let users = []
        friends.map(friend => {
            if (friend.selected) {
                users.push(friend.name)
                return
            }
        })
        values["users"] = users.join(',')
        console.log({ values })

        fetch("http://localhost:8080/create-chat", {
            method: "POST",
            headers: {
                'Content-Type': "multipart/form-data"
            },
            body: JSON.stringify(values),
        })
            .then(response => response.json())
            .then(response => console.log(response))
        setName('')
        setIsPrivate(false)
        closeForm()
    }

    // when private is selected, disable group chat name and description and uncheck all followers
    // When group is selected enable group chat name and description
    const handlePrivateChange = (privateChat) => {
        if (privateChat) {
            setIsPrivate(true);
            const updatedFriends = friends.map(friend => { return { ...friend, selected: false } })
            setFriends(updatedFriends)
        } else {
            const updatedFriends = friends.map(friend => { return { ...friend, selected: false } })
            setFriends(updatedFriends)
            setIsPrivate(false);
        }
    }

    // when private is selected, only select one follower
    // when group is selected, select as many followers
    const handleFriendClick = (id) => {
        const updatedFriends = friends.map(friend => {
            if (isPrivate) {
                if (friend.name === id) {
                    return { ...friend, selected: true };
                }
                return { ...friend, selected: false };
            } else {
                if (friend.name === id) {
                    return { ...friend, selected: !friend.selected };
                }
                return friend
            }
        });
        setFriends(updatedFriends);
    }

    const [visible, setVisible] = useState(false);

    const closeForm = () => {
        setIsPrivate(false)
        setVisible((prev) => !prev)
    };
    const openForm = () => setVisible((prev) => !prev);


    return (
        <>
            {visible &&
                <div className="create-chat-form-container">
                    <div className="create-chat-close-container">
                        <button className="create-chat-close-button" type="button" onClick={closeForm}>
                            <span>&times;</span>
                        </button>
                        <h1>Create Chat</h1>
                    </div>
                    <form onSubmit={handleGroupChatSubmit} className="chat-form">
                        <input type="text" name="chat-name" id="chat-name" placeholder="Enter Group Chat Name Here" onChange={(e) => setName(e.target.value)} disabled={isPrivate} value={name} required /><br />
                        <textarea name="chat-description" id="chat-description" placeholder="Description" onChange={(e) => setDescription(e.target.value)} disabled={isPrivate} value={description} /><br />
                        <div className="create-chat-type">
                            <div>
                                <input type="radio" name="chat-type" id="group" value="group" onChange={() => handlePrivateChange(false)} defaultChecked />
                                <label htmlFor="group">Group</label>
                            </div>
                            <div>
                                <input type="radio" name="chat-type" id="private" value="private" onChange={() => handlePrivateChange(true)} />
                                <label htmlFor="private">Private</label>
                            </div>
                        </div>
                        <div className="create-chat-followers">
                            {friends.map(friend => (
                                <div>
                                    <input type="checkbox" className="friend-info" id={friend.name} checked={friend.selected} onChange={() => handleFriendClick(friend.name)} />
                                    <label htmlFor={friend.name}>{friend.name}</label>
                                </div>
                            ))}
                        </div>
                        <div className="create-chat-submit-container">
                            <input className="create-chat-submit-button" type="submit" value="Submit" />
                        </div>
                    </form>
                </div>
            }
            <button id="create-chat-button" onClick={openForm} disabled={visible}>
                <img src="../../public/assets/img/add-chat-icon.png" alt="" />
            </button>

        </>
    )
}

export const GetChat = () => {
    const [isPrivate, setIsPrivate] = useState(false)
    const [chats, setChats] = useState([])

    // send uuid to golang and create websocket for chat
    // and make chat container
    const openChatRoom = (chatroomId) => {
        closeChatRooms()
        console.log(chatroomId)
    }

    const displayPrivateChatRooms = (privateChat) => {
        if (privateChat) {
            fetch('http://localhost:8080/get-chatrooms')
                .then(response => response.json())
                .then(data => {
                    console.log(data)
                    setChats(data)
                })
            setIsPrivate(true);
        } else {
            fetch('http://localhost:8080/get-chatrooms')
                .then(response => response.json())
                .then(data => {
                    console.log(data)
                    setChats(data)
                })
            setIsPrivate(false);
        }
    }

    const [visible, setVisible] = useState(false)
    const closeChatRooms = () => {
        setIsPrivate(false)
        setVisible((prev) => !prev)
    }
    const openChatRooms = () => {
        fetch('http://localhost:8080/get-chatrooms')
            .then(response => response.json())
            .then(data => {
                console.log(data)
                setChats(data)
            })
        setVisible((prev) => !prev)
    }


    return (
        <div className="open-chat">
            {visible &&
                <div className="open-chat-container">
                    <div className="open-chat-close-container">
                        <button className="open-chat-close-button" type="button" onClick={closeChatRooms}>
                            <span>&times;</span>
                        </button>
                        <h1>Chat Rooms</h1>
                        <CreateChat />
                    </div>
                    <div className="chatroom-type">
                        <div>
                            <input type="radio" name="chat-type" id="group" value="group" onChange={() => displayPrivateChatRooms(false)} defaultChecked />
                            <label htmlFor="group">Group</label>
                        </div>
                        <div>
                            <input type="radio" name="chat-type" id="private" value="private" onChange={() => displayPrivateChatRooms(true)} />
                            <label htmlFor="private">Private</label>
                        </div>
                    </div>
                    <div className="chatrooms">
                        {isPrivate ? (
                            <>
                                {chats["private-chatrooms"] ? (
                                    <>
                                        {chats["private-chatrooms"].map(chat =>
                                            <button onClick={() => openChatRoom(chat["chatroom-id"])}>
                                                <h2>{chat["users"]}</h2>
                                            </button>

                                        )}
                                    </>
                                ) : (
                                    <h1>No Private Chats Yet?</h1>
                                )
                                }

                            </>
                        ) : (
                            <>
                                {chats["group-chatrooms"] ? (
                                    <>
                                        {chats["group-chatrooms"].map(chat =>
                                            <button onClick={() => openChatRoom(chat["chatroom-id"])}>
                                                {chat["chat-name"] ? (
                                                    <h2>{chat["chat-name"]}</h2>
                                                ) : (
                                                    <p>{chat["users"]}</p>
                                                )}
                                                {/* {chat["chat-description"] ? (
                                                    <p>{chat["chat-description"]}</p>
                                                ) : (
                                                    <p>{chat["users"]}</p>
                                                )} */}
                                                <p>{chat["users"]}</p>
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <h1>No Group Chats</h1>
                                    </>
                                )
                                }
                            </>
                        )}
                    </div>
                </div>
            }
            <button id="open-chat-button">
                <img src="../../public/assets/img/chats-icon.png" onClick={openChatRooms} alt="" />
            </button>
        </div>
    )
}