import React, { useState, useEffect } from "react"
export const CreateChat = (newChat) => {
    const [name, setName] = useState('')
    const [user, setUser] = useState('')
    const [description, setDescription] = useState('')
    const [visible, setVisible] = useState(false);
    console.log({ newChat })

    // const [chatAvatar, setChatAvatar] = useState('')
    const [isPrivate, setIsPrivate] = useState(false)
    const friendsArr = [
        { name: "j", selected: false },
        { name: "a", selected: false },
        { name: "m", selected: false },
        { name: "k", selected: false },
        { name: "jas", selected: false },
    ]
    const [friends, setFriends] = useState(friendsArr)
    useEffect(() => {
        fetch('http://localhost:8080/api/user')
            .then(response => response.json())
            .then(data => {

                setUser(data["nickname"])
            })
    }, [visible])
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
        // value["chat-avatar"]=chatAvatar
        console.log({ values })

        fetch("http://localhost:8080/create-chat", {
            method: "POST",
            headers: {
                'Content-Type': "multipart/form-data"
            },
            body: JSON.stringify(values),
        })
            .then(response => response.json())
            .then(response => newChat["onSubmit"](response))
        setName('')
        setDescription('')
        setIsPrivate(false)
        // reset selected friends
        const updatedFriends = friends.map(friend => { return { ...friend, selected: false } })
        setFriends(updatedFriends)
        setIsPrivate(false);
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
                        {/* <input
                            type="text"
                            className="chat-image"
                            id="avatar"
                            placeholder="https://..."
                            onChange={(e) => setChatAvatar(e.target.value)}
                        /> */}
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
                            {friends.map(friend => {
                                if (friend.name != user) {
                                    return (<div>
                                        <input type="checkbox" className="friend-info" id={friend.name} checked={friend.selected} onChange={() => handleFriendClick(friend.name)} />
                                        <label htmlFor={friend.name}>{friend.name}</label>
                                    </div>
                                    )
                                }
                            }
                            )}
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
