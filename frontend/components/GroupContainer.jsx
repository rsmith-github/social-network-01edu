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
                    console.log("groups", data)
                    setGroupArr(data)
                    console.log(groupArr)
                    setLoaded(true)
                })
        }
    }, [loaded])


    const newGroupCreated = (groupInfo) => {
        setGroupArr(groupRooms => {
            console.log({ groupInfo })
            if (groupRooms === []) {
                return [groupInfo]
            } else {
                return [...groupRooms, groupInfo]
            }
        });
    }
    return (
        <div className="group-posts-container">
            <div className="group-post-rooms">
                {groupArr.map((group, i) => (
                    <>
                        <GroupButton index={i} group={group} />
                    </>
                ))}
            </div>
            <div>
                <CreateGroupButton onSubmit={newGroupCreated} />
            </div>
        </div>
    )
}