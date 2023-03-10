import React, { useEffect, useState } from "react"
export const AddUserToGroupButton = (groupInfo) => {
    const [errorMes, setErrorMes] = useState("")
    const [friends, setFriends] = useState([])
    const [searchInput, setSearchInput] = useState("");
    const [groupMembers, setGroupMembers] = useState([])
    const groupId = groupInfo["group"]["group"]["group-id"]
    const user = groupInfo["user"]
    console.log(groupInfo, "add user to group")

    useEffect(() => {
        fetch('http://localhost:8080/group-members', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: groupId,
        })
            .then(response => response.json())
            .then(data => {
                setGroupMembers(data)
            })
    }, [])

    useEffect(() => {

        const potentialGroupMembers = async () => {
            // Fetch users from "all users" api
            const usersPromise = await fetch("http://localhost:8080/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const newData = await usersPromise.json();
            let friends = []
            console.log(newData)
            newData.map(friend => {
                if (!groupMembers.includes(friend.nickname)) {
                    friends.push({ name: friend.nickname, selected: false })
                }
            })
            friends.sort((a, b) => a.name.localeCompare(b.name))
            setFriends(friends)
        };
        potentialGroupMembers()
    }, [groupMembers])

    let filteredFriends = []
    if (friends != null) {
        filteredFriends = friends.filter((checkbox) =>
            checkbox.name.toLowerCase().includes(searchInput.toLowerCase()))
    }

    const handleFriendClick = (id) => {
        const updatedUsers = friends.map(member => {
            if (member.name === id) {
                return { ...member, selected: !member.selected };
            }
            return member
        });
        setFriends(updatedUsers);
    }

    const handleUserSubmit = (evt) => {
        evt.preventDefault()
        let users = []
        friends.map(friend => {
            if (friend.selected) {
                users.push(friend.name)
                return
            }
        })
        let values = groupInfo["group"]["group"]
        values["users"] = users.join(',')
        values["action"] = "add user"
        console.log(values)

        // update group, if name was not there before-> send request
        // if name was removed-> remove user  prevent from adding to group
        groupInfo["socket"].send(JSON.stringify(values))
        setErrorMes("Invites Have Been Sent")
        setTimeout(() => groupInfo["onClose"](), 3000)
    }


    return (
        <form className="group-members-form" onSubmit={handleUserSubmit}>
            <div className="comment-post-header">
                <h1>Add Members </h1>
            </div>
            <input type="text" className="search-friends" placeholder="Find Your Friends" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <div className="create-chat-followers">
                {filteredFriends.slice().map(friend => {
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