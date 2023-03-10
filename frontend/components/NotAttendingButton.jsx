import React, { useState } from "react"

export const NotAttendingButton = (eventInfo) => {
    const [errorMes, setErrorMes] = useState("")
    const [active, setActive] = useState(eventInfo["active"])
    const eventId = eventInfo.id

    const handleGroupEventInvite = (evt) => {
        evt.preventDefault()
        const values = { "event-id": eventId, "attending-status": "n" }
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
                console.log(response)
                if (response["error"] != "") {
                    setErrorMes(response["error"])
                } else {
                    console.log({ response })
                    eventInfo["edit"](response)
                }
            })
    }

    return (
        <>
            <button type="button" className="rejected" onClick={handleGroupEventInvite} disabled={!active}> Not Going ?</button>
            {errorMes &&
                <>
                    <p className="event-error-message">{errorMes}</p>
                </>
            }
        </>
    )
}