import React, { useState, useEffect } from "react"
export const CreateChat = (newChat) => {
    const [name, setName] = useState('')
    const [user, setUser] = useState('')
    const [description, setDescription] = useState('')
    const [visible, setVisible] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false)
    const [friends, setFriends] = useState([])
    const [urlImage, setUrlImage] = useState("")
    const [selectedImage, setSelectedImage] = useState(null)
    const [localImage, setLocalImage] = useState("")
    const [local, setLocal] = useState(false)
    const [errorMes, setErrorMes] = useState("")
    const [searchInput, setSearchInput] = useState("");

    useEffect(() => {
        fetch('http://localhost:8080/api/user')
            .then(response => response.json())
            .then(data => {

                setUser(data["nickname"])
            })
    }, [visible])

    // fetch to get the names of followers to create chat and add selected key and set to false
    useEffect(() => {
        fetch('http://localhost:8080/get-friends')
            .then(response => response.json())
            .then(data => {
                let friends = []
                data.map(friend => friends.push({ name: friend, selected: false }))
                setFriends(friends)
            })
    }, [visible])

    const filteredFriends = friends.filter((checkbox) =>
        checkbox.name.toLowerCase().includes(searchInput.toLowerCase()));

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
        if (local) {
            values["chat-avatar"] = localImage
        } else {
            values["chat-avatar"] = urlImage
        }
        console.log({ values })
        if (users.length != 0) {
            fetch("http://localhost:8080/create-chat", {
                method: "POST",
                headers: {
                    'Content-Type': "multipart/form-data"
                },
                body: JSON.stringify(values),
            })
                .then(response => response.json())
                .then(response => {
                    if (!response.hasOwnProperty("chatroom-id")) {
                        setErrorMes("error creating group chat! Please Try Again")
                    } else {
                        newChat["onSubmit"](response)
                        setName('')
                        setDescription('')
                        setIsPrivate(false)
                        const updatedFriends = friends.map(friend => { return { ...friend, selected: false } })
                        setFriends(updatedFriends)
                        setIsPrivate(false);
                        setUrlImage("")
                        setSelectedImage(null)
                        setLocalImage("")
                        setLocal(false)
                        closeForm()
                    }
                })
        } else {
            setErrorMes("Please Add User to Group")
        }



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

    const handleLocalChange = (location) => {
        if (location) {
            setLocal(true)
        } else {
            setLocal(false)
        }

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
                        <div className="image-location">
                            <div>
                                <input type="radio" id="Url" name="img-location" value="Url" onChange={() => handleLocalChange(false)} defaultChecked />
                                <label htmlFor="Url">Online</label>
                            </div>
                            <div>
                                <input type="radio" id="local" name="img-location" value="local" onChange={() => handleLocalChange(true)} />
                                <label htmlFor="local">Local</label>
                            </div>
                        </div>
                        {local ? (
                            <>
                                {selectedImage &&
                                    <div className="create-chat-image-container">
                                        <img src={URL.createObjectURL(selectedImage)} alt="" onClick={() => {
                                            document.querySelector(".create-chat-image").value = ""
                                            setLocalImage("")
                                            setSelectedImage(null)
                                        }} />
                                    </div>}
                                <div className="add-chat-image">
                                    <input type="file" className="create-chat-image" onChange={(e) => {
                                        if (e.target.files[0].size < 20000000) {
                                            setSelectedImage(e.target.files[0])
                                            const fileReader = new FileReader();
                                            fileReader.onload = function (e) {
                                                setLocalImage(e.target.result);
                                            };
                                            fileReader.readAsDataURL(e.target.files[0]);
                                        }
                                        ;
                                    }} />
                                </div>
                            </>
                        ) : (
                            <>
                                {urlImage &&
                                    <div className="create-chat-image-container">
                                        <img src={urlImage} alt="" onClick={() => {
                                            document.querySelector(".create-chat-image").value = ""
                                            setUrlImage("")
                                        }} />
                                    </div>}
                                <div className="add-chat-image">
                                    <input type="text" className="create-chat-image" id="create-chat-image" placeholder="https://..."
                                        onChange={(e) => setUrlImage(e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                        <p className="chat-image-message">File Must Not Exceed 20MB</p>
                        <input type="text" name="chat-name" id="chat-name" placeholder="Enter Group Chat Name Here" onChange={(e) => setName(e.target.value)} disabled={isPrivate} value={name} required />
                        <textarea name="chat-description" id="chat-description" placeholder="Description" onChange={(e) => setDescription(e.target.value)} disabled={isPrivate} value={description} />
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
                        <input type="text" className="search-friends" placeholder="Find Your Friends" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
                        <div className="create-chat-followers">
                            {filteredFriends.map(friend => {
                                if (friend.name != user) {
                                    return (
                                        <div>
                                            <input type="checkbox" className="friend-info" id={friend.name} checked={friend.selected} onChange={() => handleFriendClick(friend.name)} />
                                            <label htmlFor={friend.name}>{friend.name}</label>
                                        </div>
                                    )
                                }
                            }
                            )}
                        </div>
                        {errorMes &&
                            <p className="error-message">{errorMes}</p>
                        }
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
