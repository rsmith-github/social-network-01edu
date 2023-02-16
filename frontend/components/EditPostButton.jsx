import React, { useState } from "react"
export const EditButton = (editedPost) => {
    const [urlImage, setUrlImage] = useState("")
    const [selectedImage, setSelectedImage] = useState(null)
    const [localImage, setLocalImage] = useState("")
    const [emoji, setEmoji] = useState("")
    const [thread, setThread] = useState("")
    const [threadArr, setThreadArr] = useState([])
    const [visible, setVisible] = useState(false)
    const [local, setLocal] = useState(false)
    let editPost = editedPost
    // const [displayImg, setDisplayImg]=useState(null)

    const openEditPostForm = () => {
        setVisible((prev) => !prev)

        // prefillForm()
    };

    const closeEditPostForm = () => {
        setVisible((prev) => !prev)
        // prefillForm()
    };

    const handleLocalChange = (location) => {
        console.log({ location })
        if (location) {
            setLocal(true)
        } else {
            setLocal(false)
        }

    }
    return (
        <>
            {visible &&
                <div className="edit-post-container">
                    <form className="edit-post-form" >
                        <button className="create-post-close-button" type="button" onClick={closeEditPostForm}>
                            <span>&times;</span>
                        </button>
                        <h1>Edit Post </h1>
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
                        {editPost["post-image"]&&
                        <div className="create-post-image-container">
                             <img src={editPost["post-image"]}/>
                        </div>
                        }
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
            <button type="button" onClick={openEditPostForm}>
                <img src="../../public/assets/img/edit.png" />
            </button>
        </>
    )
}