import React, { useState, useEffect } from "react"
export const CreatePost = (newPost) => {
    const [urlImage, setUrlImage] = useState("")
    const [selectedImage, setSelectedImage] = useState(null)
    const [localImage, setLocalImage] = useState("")
    const [emoji, setEmoji] = useState("")
    const [thread, setThread] = useState("")
    const [errorMes, setErrorMes] = useState("")
    const [threadArr, setThreadArr] = useState([])
    const [visible, setVisible] = useState(false)
    const [local, setLocal] = useState(false)
    const [almostPrivate, setAlmostPrivate] = useState(false)
    const [searchInput, setSearchInput] = useState("");
    const [friends, setFriends] = useState([])
    const [user, setUser] = useState('')
    useEffect(() => {
        fetch('http://localhost:8080/api/user')
            .then(response => response.json())
            .then(data => {

                setUser(data["nickname"])
            })
    }, [visible])

    useEffect(() => {
        const fetchUsersData = async () => {
            // Fetch users from "all users" api
            const usersPromise = await fetch("http://localhost:8080/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const usersJson = await usersPromise.json(); //getting current user.
            let potentialMembers = []
            usersJson.map(receivedUser => potentialMembers.push({ name: receivedUser["nickname"], selected: false }))
            setFriends(potentialMembers);
        };
        fetchUsersData()
    }, [visible])

    const filteredFriends = friends.filter((checkbox) =>
        checkbox.name.toLowerCase().includes(searchInput.toLowerCase()))

    const closePostForm = () => {
        setVisible((prev) => !prev)
    }

    const openPostForm = () => {
        setVisible((prev) => !prev)
    }

    const handleLocalChange = (location) => {
        console.log({ location })
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

    const handleAlmostPrivate = (privacy) => {
        console.log({ privacy })
        if (privacy) {
            setAlmostPrivate(true)
        } else {
            setAlmostPrivate(false)
        }

    }

    const handlePostSubmit = (evt) => {
        evt.preventDefault()
        const data = new FormData(evt.target);
        let values = Object.fromEntries(data.entries())
        console.log({ values })
        if (local) {
            values["post-image"] = localImage
        } else {
            values["post-image"] = urlImage
        }
        if (threadArr.length != 0) {
            values["post-threads"] = threadArr.join(",")
        }
        values['post-time'] = new Date().getTime()
        let users = []
        friends.map(friend => {
            if (friend.selected) {
                users.push(friend.name)
                return
            }
        })
        if (almostPrivate) {
            if (users.length === 0) {
                setErrorMes("Please Select Users")
                return
            } else {
                values["viewers"] = users.join(',')
            }
        }

        fetch("http://localhost:8080/create-post", {
            method: "POST",
            headers: {
                'Content-Type': "multipart/form-data"
            },
            body: JSON.stringify(values),
        })
            .then(response => response.json())
            // return array of posts and send to the top.
            .then(response => {
                if (response.hasOwnProperty("error")) {
                    setErrorMes(response["error"])
                    setTimeout(() => {
                        setErrorMes("")
                    }, 5000)
                } else {
                    if (newPost["private"]) {
                        // fetch private posts
                        console.log(newPost["private"])
                        fetch("http://localhost:8080/view-private-posts")
                            .then(response => response.json())
                            .then(response => {
                                newPost["onSubmit"](response)
                                closePostForm()
                            })
                    } else {
                        // fetch public posts
                        console.log(newPost["private"])
                        fetch("http://localhost:8080/view-public-posts")
                            .then(response => response.json())
                            .then(response => {
                                newPost["onSubmit"](response)
                                closePostForm()
                            })
                    }

                }
            })

    }

    const addThread = () => {
        if (thread != "") {
            let hashtag = "#" + thread
            setThreadArr(threadArr => {
                if (threadArr !== null) {
                    return [...threadArr, hashtag]
                } else {
                    return [hashtag]
                }
            })
            setThread("")
        }
    }
    const removeThread = (index) => {
        const newThreads = threadArr.filter((_, i) => i !== index);
        setThreadArr(newThreads);
    }

    const handleKeyPress = (evt) => {
        if (evt.key === "#") {
            evt.preventDefault()
        }
    }

    return (
        <>
            {visible &&
                <div className="create-post-container">
                    <form className="create-post-form" onSubmit={handlePostSubmit}>
                        <button className="close-button" type="button" onClick={closePostForm}>
                            <span>&times;</span>
                        </button>
                        <h1>Create Post </h1>
                        <div className="image-location">
                            <div>
                                <input type="radio" id="Url" name="img-location" value="Url" onChange={() => handleLocalChange(false)} defaultChecked />
                                <label htmlFor="Url">Add Online Image</label>
                            </div>
                            <div>
                                <input type="radio" id="local" name="img-location" value="local" onChange={() => handleLocalChange(true)} />
                                <label htmlFor="local">Add Local Image</label>
                            </div>
                        </div>
                        {local ? (
                            <>
                                {selectedImage &&
                                    <div className="create-post-image-container">
                                        <img src={URL.createObjectURL(selectedImage)} alt="" onClick={() => {
                                            document.querySelector(".create-post-image").value = ""
                                            setLocalImage("")
                                            setSelectedImage(null)
                                        }} />
                                    </div>}
                                <div className="add-post-image">
                                    <input type="file" className="create-post-image" onChange={(e) => {
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
                                    <div className="create-post-image-container">
                                        <img src={urlImage} alt="" onClick={() => {
                                            document.querySelector(".create-post-image").value = ""
                                            setUrlImage("")
                                        }} />
                                    </div>}
                                <div className="add-post-image">
                                    <input type="text" className="create-post-image" id="create-post-image" placeholder="https://..."
                                        onChange={(e) => setUrlImage(e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                        <p>File Must Not Exceed 20MB</p>
                        <textarea name="post-text-content" contentEditable={true} className="post-text-content" onChange={(e) => setEmoji(e.target.value)} placeholder="For Emojis Press: 'Windows + ;' or 'Ctrl + Cmd + Space'" />
                        <div className="create-post-threads">
                            <input type="text" className="add-thread-input" placeholder="Add Thread" value={thread} onChange={(e) => setThread(e.target.value)} onKeyPress={handleKeyPress} />
                            <button className="add-thread-button" type="button" onClick={addThread}>+</button>
                        </div>
                        {threadArr &&
                            <>
                                <p className="remove-thread">Click the # to remove</p>
                                <div className="thread-container">
                                    {threadArr.map((t, index) =>
                                        <p key={index} className="added-thread" onClick={() => removeThread(index)}>{t}</p>
                                    )
                                    }
                                </div>
                            </>
                        }
                        <div className="image-location">
                            <div>
                                <input type="radio" id="local" name="privacy" value="public" onChange={() => handleAlmostPrivate(false)} defaultChecked />
                                <label htmlFor="Url">Public</label>
                            </div>
                            <div>
                                <input type="radio" id="local" name="privacy" value="private" onChange={() => handleAlmostPrivate(false)} />
                                <label htmlFor="local">Private</label>
                            </div>
                            <div>
                                <input type="radio" id="local" name="privacy" value="almost-private" onChange={() => handleAlmostPrivate(true)} />
                                <label htmlFor="local">Almost Private</label>
                            </div>
                        </div>
                        {almostPrivate &&
                            <>
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
                            </>
                        }
                        {errorMes &&
                            <p className="error-message">{errorMes}</p>
                        }
                        <input type="submit" className="create-post-submit-button" value="Create Post" />
                    </form>
                </div>

            }

            <button className="create-post-button" onClick={openPostForm}>
                <img src="https://cdn-icons-png.flaticon.com/128/4712/4712540.png" alt="" />
            </button>
        </>
    )
}