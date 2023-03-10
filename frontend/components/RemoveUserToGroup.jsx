import React, { useEffect, useState } from "react"
export const RemoveUserToGroupButton = (groupInfo) => {
    const [errorMes, setErrorMes] = useState("")
    const [friends, setFriends] = useState([])
    const [searchInput, setSearchInput] = useState("");
    const groupId = groupInfo["group"]["group"]["group-id"]
    const user = groupInfo["user"]
    useEffect(() => {
        fetch('http://localhost:8080/group-members', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: groupId,
        })
            .then(response => response.json())
            .then(data => {
                console.log({ data })
                let friends = []
                data.map(friend => friends.push({ name: friend, selected: false }))
                friends.sort((a, b) => a.name.localeCompare(b.name))
                setFriends(friends)
            })
    }, [])
    let filteredFriends = []
    if (friends != undefined) {
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
        values["action"] = "remove"
        console.log(values)

        fetch("http://localhost:8080/remove-group-member", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values)
        })
            .then(response => response.text())
            .then(response => {
                setErrorMes(response)
                setTimeout(() => groupInfo["onClose"](), 5000)
            })
        groupInfo["socket"].send(JSON.stringify(values))
    }


    return (
        <form className="group-members-form" onSubmit={handleUserSubmit}>
            <div className="comment-post-header">
                <h1>Remove Members </h1>
            </div>
            <input type="text" className="search-friends" placeholder="Find Your Friends" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <div className="create-chat-followers">
                {filteredFriends.map(friend => {
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