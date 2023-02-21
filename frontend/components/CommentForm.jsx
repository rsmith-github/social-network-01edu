
import React, { useState } from "react"
export const AddComment = (newComment) => {
    const [urlImage, setUrlImage] = useState("")
    const [selectedImage, setSelectedImage] = useState(null)
    const [localImage, setLocalImage] = useState("")
    const [emoji, setEmoji] = useState("")
    const [thread, setThread] = useState("")
    const [threadArr, setThreadArr] = useState([])
    const [visible, setVisible] = useState(false)
    const [local, setLocal] = useState(false)
    const [errorMes, setErrorMes] = useState("")
    const postId = newComment.id

    const openCommentForm = () => {
        setVisible((prev) => !prev)
    };

    const closeCommentForm = () => {
        setVisible((prev) => !prev)
    };

    const handleLocalChange = (location) => {
        if (location) {
            setLocal(true)
        } else {
            setLocal(false)
        }

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


    const handleCommentSubmit = (evt) => {
        evt.preventDefault()
        const data = new FormData(evt.target);
        let values = Object.fromEntries(data.entries())
        if (local) {
            values["comment-image"] = localImage
        } else {
            values["comment-image"] = urlImage
        }
        if (threadArr.length != 0) {
            values["comment-threads"] = threadArr.join(",")
        }
        values['comment-time'] = new Date().getTime()


        fetch("http://localhost:8080/create-comment", {
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
                if (response.hasOwnProperty("error")) {
                    setErrorMes(response["error"])
                } else {
                    newComment["onSubmit"](response)
                    closeCommentForm()
                }

            })

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
                    <form className="add-comment-form" onSubmit={handleCommentSubmit}>
                        <button className="create-post-close-button" type="button" onClick={closeCommentForm}>
                            <span>&times;</span>
                        </button>
                        <h1>Create Comment </h1>
                        <input type="hidden" name="post-id" value={postId} />
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
                            <textarea name="comment-text" className="post-text-content" onChange={(e) => setEmoji(e.target.value)} placeholder="For Emojis Press: 'Windows + ;' or 'Ctrl + Cmd + Space'" />
                        </div>
                        <div className="create-post-threads">
                            <input type="text" className="add-thread-input" placeholder="Add Thread" value={thread} onChange={(e) => setThread(e.target.value)} onKeyPress={handleKeyPress} />
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
                        {errorMes &&
                            <p className="edit-error-message">{errorMes}</p>
                        }
                        <input type="submit" className="create-post-submit-button" value="Create Comment" />
                    </form>
                </div>
            }
            <button type="button" className="add-comment-button" onClick={openCommentForm}> Add Comment</button>
        </>
    )
}