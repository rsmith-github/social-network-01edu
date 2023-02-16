import React, { useState } from "react"
export const CreatePost = (newPost) => {
    const [urlImage, setUrlImage] = useState("")
    const [selectedImage, setSelectedImage] = useState(null)
    const [localImage, setLocalImage] = useState("")
    const [emoji, setEmoji] = useState("")
    const [thread, setThread] = useState("")
    const [threadArr, setThreadArr] = useState([])
    const [visible, setVisible] = useState(false)
    const [local, setLocal] = useState(false)


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
                console.log(response)
                newPost["onSubmit"](response)
                closePostForm()
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


    return (
        <>
            {visible &&
                <div className="create-post-container">
                    <form className="create-post-form" onSubmit={handlePostSubmit}>
                        <button className="create-post-close-button" type="button" onClick={closePostForm}>
                            <span>&times;</span>
                        </button>
                        <h1>Create Post </h1>
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
                                    <label htmlFor="create-post-image">Add Image</label>
                                </div>
                            </>
                        )}
                        <p>File Must Not Exceed 20MB</p>
                        <div className="create-post-textarea" contentEditable={true}>
                            <textarea name="post-text-content" className="post-text-content" onChange={(e) => setEmoji(e.target.value)} placeholder="For Emojis Press: 'Windows + ;' or 'Ctrl + Cmd + Space'" />
                        </div>
                        <div className="create-post-threads">
                            <input type="text" className="add-thread-input" placeholder="Add Thread" value={thread} onChange={(e) => setThread(e.target.value)} />
                            <button className="add-thread-button" type="button" onClick={addThread}>+</button>
                            {threadArr &&
                                <>
                                    <p>Click the # to remove</p>
                                    <div className="thread-container">
                                        {threadArr.map((t, index) =>
                                            <p key={index} className="added-thread" onClick={() => removeThread(index)}>{t}</p>
                                        )
                                        }
                                    </div>
                                </>
                            }

                        </div>

                        <input type="submit" className="create-post-submit-button" value="Create" />
                    </form>
                </div>

            }

            <button className="create-post-button" onClick={openPostForm}>
                <img src="../../public/assets/img/add-post-icon.png" alt="" />
            </button>
        </>
    )
}