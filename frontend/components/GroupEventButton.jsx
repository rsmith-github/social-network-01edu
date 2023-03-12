import React, { useEffect, useState } from "react"
import { AttendanceButton } from "./AttendanceButton";
import { AttendingButton } from "./AttendingButton";
import { CreateEventForm } from "./CreateEventForm";
import { NotAttendingButton } from "./NotAttendingButton";
import { RefreshEventsButton } from "./RefreshEventsButton";
import { RemoveEventButton } from "./RemoveEventButton";
export const EventGroupButton = (groupInfo) => {
    const [errorMes, setErrorMes] = useState("")
    const [events, setEvents] = useState([])
    const [searchInput, setSearchInput] = useState("");
    const groupId = groupInfo.id

    useEffect(() => {
        setEvents(groupInfo["events"])
    }, [groupInfo["events"]])

    const dateFormat = (strDate) => {
        let date = new Date(strDate)
        let dd = date.getDate();
        let mm = date.getMonth() + 1;
        let yyyy = date.getFullYear().toString().substr(-2);
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }
        let hh = date.getHours()
        let min = date.getMinutes()
        date = dd + "/" + mm + "/" + yyyy + " " + hh + ":" + min;
        return date.toString();
    }

    var ranges = [
        { divider: 1e18, suffix: 'E' },
        { divider: 1e15, suffix: 'P' },
        { divider: 1e12, suffix: 'T' },
        { divider: 1e9, suffix: 'G' },
        { divider: 1e6, suffix: 'M' },
        { divider: 1e3, suffix: 'k' }
    ];

    function formatNumber(n) {
        for (var i = 0; i < ranges.length; i++) {
            if (n >= ranges[i].divider) {
                return (Math.round((n / ranges[i].divider) * 10) / 10).toString() + ranges[i].suffix;
            }
        }
        return n.toString();
    }

    const handleEditEvent = (edited) => {
        setEvents(prevEvent => {
            const index = prevEvent.findIndex(event => event["event-id"] === edited["event-id"])
            if (index === -1) {
                return prevEvent
            }
            const newEvent = [...prevEvent]
            edited["attendees"] = formatNumber(edited["attendees"])
            newEvent[index] = edited
            return newEvent
        })
    }

    const handleDeleteEvent = (deleteEvent) => {
        const updatedEvents = events.filter((event) => event["event-id"] !== deleteEvent["event-id"]);
        setEvents(updatedEvents);
    }

    const newEventCreated = (response) => {
        setEvents(prevEvent => {
            let newEventArr = [response, ...prevEvent]
            newEventArr.sort((a, b) => a["event-time"] - (b["event-time"]))
            return newEventArr
        })
    }

    let filteredEvents = []
    if (events != null) {
        filteredEvents = events.filter((event) =>
            event["event-title"].toLowerCase().includes(searchInput.toLowerCase()))
    }

    return (
        <div className="group-members-form" >
            <div className="comment-post-header">
                <h1 className="events-header"> Events </h1>
                <RefreshEventsButton id={groupId} update={setEvents} />
            </div>
            <input type="text" className="search-friends" placeholder="Find Your Events" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <div className="events-container">
                {filteredEvents.slice().map(event => (
                    <div className="group-event-button">
                        <div className="group-event-info-container">
                            <div className="group-event-info">
                                <h3>{event["event-title"]}</h3>
                                <p className="group-event-description">{event["event-description"]}</p>
                                <p>When: {dateFormat(event["event-time"])}</p>
                            </div>
                            <div>
                                {event["event-organiser-user"] &&
                                    <RemoveEventButton id={event["event-id"]} active={event["active"]} delete={handleDeleteEvent} />
                                }
                            </div>
                        </div>
                        <div className="group-event-answer">
                            {event["event-attending"] ? (
                                <NotAttendingButton id={event["event-id"]} active={event["active"]} edit={handleEditEvent} />
                            ) : (
                                <AttendingButton id={event["event-id"]} active={event["active"]} edit={handleEditEvent} />
                            )}
                            <p>{formatNumber(event["attendees"])}</p>
                        </div>
                        <AttendanceButton id={event["event-id"]} active={event["active"]} title={event["event-title"]} />
                    </div>
                )
                )}
            </div>
            {errorMes &&
                <p className="error-message">{errorMes}</p>
            }
            <CreateEventForm id={groupId} update={newEventCreated} />
        </div>
    )
}