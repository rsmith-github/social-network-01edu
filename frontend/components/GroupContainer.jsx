import React, { useState, useEffect } from "react"
import { CreateGroupButton } from "./CreateGroupButton"
import { GroupButton } from "./GroupButton"

export const GroupContainer = (props) => {
    const [loaded, setLoaded] = useState(false)
    const [groupArr, setGroupArr] = useState([])
    useEffect(() => {
        if (props["groups"] != null && props["groups"] != undefined)
            setGroupArr(props["groups"])
        setLoaded(true)
    }, [props])

    const newGroupCreated = (groupInfo) => {
        setGroupArr(groupRooms => {
            if (Array.isArray(groupRooms) && groupRooms.length === 0) {
                return [groupInfo]
            } else {
                return [...groupRooms, groupInfo]
            }
        });
    }
    return (
        <div className="group-posts-container">
            <div className="group-post-rooms">
                {groupArr.length > 0 &&
                    <>
                        {groupArr.map((group, i) => (
                            <>
                                <GroupButton index={i} group={group} socket={props.socket} />
                            </>
                        ))}
                    </>
                }
            </div>
            <div>
                <CreateGroupButton onSubmit={newGroupCreated} />
            </div>
        </div>
    )
}