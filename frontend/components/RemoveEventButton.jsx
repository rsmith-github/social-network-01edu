import React, { useState } from "react"

export const RemoveEventButton = (eventInfo) => {
    const [errorMes, setErrorMes] = useState("")
    const [active, setActive] = useState(eventInfo["active"])
    const eventId = eventInfo.id

    const handleGroupEventInvite = (evt) => {
        evt.preventDefault()
        const values = { "event-id": eventId, "attending-status": "delete" }
        console.log(values)
        fetch("http://localhost:8080/event-interactions", {
            method: "POST",
            headers: {
                'Content-Type': "multipart/form-data"
            },
            body: JSON.stringify(values),
        })
            .then(response => response.json())
            // return array of posts and send to the top.
            .then(response => {
                if (response["error"] != "") {
                    setErrorMes(response["error"])
                } else {
                    eventInfo["delete"](response)
                }
            })
    }

    return (
        <>
            <button type="button" className="delete-group-event-button" onClick={handleGroupEventInvite}>
                <img src="../../public/assets/img/delete.png" />
            </button>
            {errorMes &&
                <>
                    <p className="event-error-message">{errorMes}</p>
                    {setTimeout(() => setErrorMes(""), 1000)}
                </>
            }
        </>
    )
}