import React, { useState, useEffect } from "react"

export const CreateGroupButton = (newGroup) => {
    const [visible, setVisible] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)
    const [urlImage, setUrlImage] = useState("")
    const [selectedImage, setSelectedImage] = useState(null)
    const [localImage, setLocalImage] = useState("")
    const [local, setLocal] = useState(false)
    const [errorMes, setErrorMes] = useState("")

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

    const handleGroupPostSubmit = (evt) => {
        evt.preventDefault()
        setLoading(true)
        const data = new FormData(evt.target);
        let values = Object.fromEntries(data.entries())
        if (local) {
            values["group-avatar"] = localImage
        } else {
            values["group-avatar"] = urlImage
        }
        console.log({ values })
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
                    setLoading(false);
                    setUrlImage("")
                    setSelectedImage(null)
                    setLocalImage("")
                    setLocal(false)
                    closeForm()
                }
            })
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
                                    <div className="create-group-image-container">
                                        <img src={URL.createObjectURL(selectedImage)} alt="" onClick={() => {
                                            document.querySelector(".create-group-image").value = ""
                                            setLocalImage("")
                                            setSelectedImage(null)
                                        }} />
                                    </div>}
                                <div className="add-post-image">
                                    <input type="file" className="create-group-image" onChange={(e) => {
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
                                            document.querySelector(".create-group-image").value = ""
                                            setUrlImage("")
                                        }} />
                                    </div>}
                                <div className="add-post-image">
                                    <input type="text" className="create-group-image" id="create-group-image" placeholder="https://..."
                                        onChange={(e) => setUrlImage(e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                        <p className="chat-image-message">File Must Not Exceed 20MB</p>
                        <input type="text" name="group-name" className="post-text-content" placeholder="Enter Group Name Here" onChange={(e) => setName(e.target.value)} disabled={loading} value={name} required />
                        <textarea name="group-description" className="post-text-content" placeholder="Description" onChange={(e) => setDescription(e.target.value)} disabled={loading} value={description} />
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
