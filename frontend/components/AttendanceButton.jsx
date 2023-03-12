import React, { useState } from "react"

export const AttendanceButton = (eventInfo) => {
    const [errorMes, setErrorMes] = useState("")
    const [active, setActive] = useState(eventInfo["active"])
    const [users, setUsers] = useState([])
    const [visible, setVisible] = useState(false)
    const eventId = eventInfo.id

    const handleGroupEventInvite = (evt) => {
        evt.preventDefault()
        const values = { "event-id": eventId, "attending-status": "attendance" }
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
                if (response != null) {
                    console.log({ response })
                    response.sort((a, b) => a.nickname.localeCompare(b.nickname))
                    setUsers(response)
                    setVisible(true)
                } else {
                    setErrorMes("Be the First to Attend This Event!")
                }
            })
    }

    const handleBrokenAuthImage = (source) => {
        if (source != "") {
            return source
        } else {
            return "https://www.transparentpng.com/thumb/user/gray-user-profile-icon-png-fP8Q1P.png"
        }
    }

    const closeAttendance = () => {
        setVisible(false)
    }

    return (
        <>
            {visible &&
                <div className="create-post-container">
                    <div className="create-group-form">
                        <div className="create-group-posts-close-container">
                            <button className="close-button" type="button" onClick={closeAttendance}>
                                <span>&times;</span>
                            </button>
                            <h2 className="event-attendance-header">{eventInfo["title"]} Attendance</h2>
                        </div>
                        <div className="search-group-container">
                            {users.map(user => {
                                return (
                                    <button type="button" className="search-group-post-button" >
                                        <div>
                                            <img src={handleBrokenAuthImage(user["avatar"])} />
                                            <p className="group-post-button-name">{user["nickname"]}</p>
                                        </div>
                                        <div className="send-group-invite">
                                            <p className="event-attending-user">...Attending</p>
                                        </div>
                                    </button>
                                )
                            }
                            )}
                        </div>
                    </div>
                </div>
            }
            <button type="button" className="group-event-attending" onClick={handleGroupEventInvite} disabled={!active}>Attendance</button>
            {errorMes &&
                <p className="event-error-message">{errorMes}</p>
            }
        </>
    )
}