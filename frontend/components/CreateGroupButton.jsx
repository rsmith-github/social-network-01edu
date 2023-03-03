import React, { useState, useEffect } from "react"

export const CreateGroupButton = (newGroup) => {
    const [visible, setVisible] = useState(false)
    const [user, setUser] = useState('')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [friends, setFriends] = useState([])
    const [urlImage, setUrlImage] = useState("")
    const [selectedImage, setSelectedImage] = useState(null)
    const [localImage, setLocalImage] = useState("")
    const [local, setLocal] = useState(false)
    const [errorMes, setErrorMes] = useState("")

    useEffect(() => {
        fetch('http://localhost:8080/api/user')
            .then(response => response.json())
            .then(data => {

                setUser(data["nickname"])
            })
    }, [visible])

    useEffect(() => {
        fetch('http://localhost:8080/get-friends')
            .then(response => response.json())
            .then(data => {
                console.log({ data })
                let friends = []
                data.map(friend => friends.push({ name: friend, selected: false }))
                console.log({ friends })
                setFriends(friends)
            })
    }, [visible])

    const openForm = () => {
        setVisible((prev) => !prev)
    };

    const closeForm = () => {
        setVisible((prev) => !prev)
    };

    const handleLocalChange = (location) => {
        if (location) {
            setLocal(true)
        } else {
            setLocal(false)
        }

    }

    const handleFriendClick = (id) => {
        const updatedFriends = friends.map(friend => {
            if (friend.name === id) {
                return { ...friend, selected: !friend.selected };
            }
            return friend
        });
        setFriends(updatedFriends);
    }

    const handleGroupPostSubmit = (evt) => {
        evt.preventDefault()
        setLoading(true)
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
            values["group-avatar"] = localImage
        } else {
            values["group-avatar"] = urlImage
        }
        console.log({ values })
        if (users.length != 0) {
            fetch("http://localhost:8080/create-group", {
                method: "POST",
                headers: {
                    'Content-Type': "multipart/form-data"
                },
                body: JSON.stringify(values),
            })
                .then(response => response.json())
                .then(response => {
                    if (!response.hasOwnProperty("group-id")) {
                        setErrorMes("error creating group chat! Please Try Again")
                    } else {
                        console.log(response)
                        newGroup["onSubmit"](response)
                        setName('')
                        setDescription('')
                        const updatedFriends = friends.map(friend => { return { ...friend, selected: false } })
                        setFriends(updatedFriends)
                        setLoading(false);
                        setUrlImage("")
                        setSelectedImage(null)
                        setLocalImage("")
                        setLocal(false)
                        closeForm()
                    }
                })
        } else {
            setErrorMes("Please Add User to Group")
            setLoading(false)
        }



    }
    return (
        <>
            {visible &&
                <div className="create-post-container">
                        <form onSubmit={handleGroupPostSubmit} className="create-group-form">
                            <div className="create-group-posts-close-container">
                                <button className="close-button" type="button" onClick={closeForm}>
                                    <span>&times;</span>
                                </button>
                                <h1>Create Group</h1>
                            </div>
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
                            <input type="text" name="group-name" id="chat-name" placeholder="Enter Group Name Here" onChange={(e) => setName(e.target.value)} disabled={loading} value={name} required />
                            <textarea name="group-description" id="chat-description" placeholder="Description" onChange={(e) => setDescription(e.target.value)} disabled={loading} value={description} />
                            <div className="create-chat-followers">
                                {friends.map(friend => {
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
            <button type="button" className="create-group-post-button" onClick={openForm} >
                <img src="https://cdn-icons-png.flaticon.com/512/60/60732.png" />
            </button>
        </>
    )
}
