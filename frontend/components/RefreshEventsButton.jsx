import React, { useState } from "react"

export const RefreshEventsButton = (eventInfo) => {
    const groupId = eventInfo.id

    const handleEventRefresh = (evt) => {
        evt.preventDefault()
        const getGroupEvents = async () => {
            // Fetch users from "all users" api
            const getGroupEventsPromise = await fetch("http://localhost:8080/get-group-events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: groupId
            });
            const newData = await getGroupEventsPromise.json();
            if (newData !== null && newData.length != 0)
                console.log({ newData })
            newData.sort((a, b) => a["event-time"] - (b["event-time"]))
            eventInfo["update"](newData)
        };
        getGroupEvents()
    }

    return (
        <>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
            <button type="button" className="refresh-group-event-button" onClick={handleEventRefresh}>
                <i className="fa">&#xf021;</i>
            </button>
        </>
    )
}