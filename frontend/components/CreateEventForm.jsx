import React, { useState } from "react"
export const CreateEventForm = (newEvent) => {
    const groupId = newEvent.id
    const [emoji, setEmoji] = useState("")
    const [emojiD, setEmojiD] = useState("")
    const [errorMes, setErrorMes] = useState("")
    const [visible, setVisible] = useState(false)
    console.log(newEvent)



    const closeEventForm = () => {
        setVisible((prev) => !prev)
    }

    const openEventForm = () => {
        setVisible((prev) => !prev)
    }

    const handleEventSubmit = (evt) => {
        evt.preventDefault()
        const data = new FormData(evt.target);
        let values = Object.fromEntries(data.entries())
        values["event-time"] = new Date(values["event-time"]).getTime()
        values["group-id"] = groupId
        console.log({ values })
        console.log(new Date().getTime())

        if (new Date(values["event-time"]).getTime() < new Date().getTime()) {
            setErrorMes("That Day has already Passed!")
        } else {
            fetch("http://localhost:8080/create-group-event", {
                method: "POST",
                headers: {
                    'Content-Type': "multipart/form-data"
                },
                body: JSON.stringify(values),
            })
                .then(response => response.json())
                .then(response => {
                    if (response["error"] != "") {
                        setErrorMes(response["error"])
                    } else {
                        newEvent["update"](response)
                        closeEventForm()
                    }
                })
        }
    }

    return (
        <>
            {visible &&
                <div className="create-post-container">
                    <form className="create-post-form" onSubmit={handleEventSubmit}>
                        <button className="close-button" type="button" onClick={closeEventForm}>
                            <span>&times;</span>
                        </button>
                        <h1>Create Event  </h1>
                        <input type="text" name="event-title" className="post-text-content" contentEditable={true} onChange={(e) => setEmoji(e.target.value)} placeholder="Enter Event Title Here" required />
                        <textarea name="event-description" contentEditable={true} className="post-text-content" onChange={(e) => setEmojiD(e.target.value)} placeholder="Enter Event Details Here" />
                        <input type="datetime-local" name="event-time" required />
                        {errorMes &&
                            <p className="error-message">{errorMes}</p>
                        }
                        <input type="submit" className="create-post-submit-button" value="Create Event" />
                    </form>
                </div>

            }
            <button type="button" className="create-post-submit-button" onClick={openEventForm}>Create Event</button>
        </>
    )
}