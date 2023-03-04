import React, { useState, useEffect } from "react"
import { CreateGroupButton } from "./CreateGroupButton"
import { GroupButton } from "./GroupButton"

export const GroupContainer = () => {
    const [groupArr, setGroupArr] = useState([])
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        if (!loaded) {
            fetch('http://localhost:8080/create-group')
                .then(response => response.json())
                .then(data => {
                    if (data.length >0 && data !==null)
                    console.log("groups", data)
                    setGroupArr(data)
                    setLoaded(true)
                })
        }
    }, [loaded])


    const newGroupCreated = (groupInfo) => {
        setGroupArr(groupRooms => {
            console.log({ groupInfo })
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
                {groupArr.length>0 &&
                <>
                {groupArr.map((group, i) => (
                    <>
                        <GroupButton index={i} group={group} />
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