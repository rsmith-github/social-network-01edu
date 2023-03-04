import React, { useEffect, useState } from "react"
export const AddUserToGroupButton = (groupInfo) => {
    const [errorMes, setErrorMes] = useState("")
    const [users, setUsers] = useState([])
    const user = groupInfo["user"]

    const fetchUsersData = async () => {
        // Fetch users from "all users" api
        const usersPromise = await fetch("http://localhost:8080/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        const usersJson = await usersPromise.json(); //getting current user.
        let potentialMembers = []
        usersJson.map(receivedUser => potentialMembers.push({ name: receivedUser["nickname"], selected: false }))
        potentialMembers.map(users => {
            const selectedMember = groupMembers.find(member => users.name === member)
            if (selectedMember) {
                users.selected = true
            }
            return users
        }
        )
        setUsers(potentialMembers);
    };

    const groupId = groupInfo["group"]["group"]["group-id"]
    const groupMembersString = groupInfo["group"]["group"]["users"]
    let groupMembers
    if (groupMembersString != "" || groupMembersString != null || groupMembersString.length === 0) {
        groupMembers = groupMembersString.split(",")
        fetchUsersData()
    }

    const handleFriendClick = (id) => {
        const updatedUsers = users.map(member => {
            if (member.name === id) {
                return { ...member, selected: !member.selected };
            }
            return member
        });
        setUsers(updatedUsers);
    }

    const handleUserSubmit = (evt) => {
        evt.preventDefault()
        const data = new FormData(evt.target);
        let values = Object.fromEntries(data.entries())
        values["group-id"] = groupId

        // update group, if name was not there before-> send request
        // if name was removed-> remove user  prevent from adding to group
        fetch("http://localhost:8080/change-group-members", {
            method: "POST",
            headers: {
                'Content-Type': "multipart/form-data"
            },
            body: JSON.stringify(values),
        })
            .then(response => response.json())
            // return array of posts and send to the top.
            .then(response => {
                if (response.hasOwnProperty("error")) {
                    setErrorMes(response["error"])
                    setTimeout(() => {
                        setErrorMes("")
                    }, 5000)
                } else {
                    console.log(response)
                    closePostForm()
                }
            })

    }


    return (
        <form className="group-members-form" onSubmit={handleUserSubmit}>
            <div className="comment-post-header">
                <h1>Members </h1>
            </div>
            <div className="create-chat-followers">
                {users.map(friend => {
                    if (friend.name != user) {
                        return (
                            <div>
                                <input type="checkbox" className="friend-info" id={friend.name} checked={friend.selected} onChange={() => handleFriendClick(friend.name)} />
                                <label htmlFor={friend.name}>{friend.name}</label>
                            </div>
                        )
                    }
                }
                )}
            </div>
            {errorMes &&
                <p className="error-message">{errorMes}</p>
            }
            <input type="submit" className="create-post-submit-button" value="Edit Members" />
        </form>
    )
}