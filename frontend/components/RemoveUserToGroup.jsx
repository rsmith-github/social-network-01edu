import React, { useEffect, useState } from "react"
export const RemoveUserToGroupButton = (groupInfo) => {
    const [errorMes, setErrorMes] = useState("")
    const [friends, setFriends] = useState([])
    const [searchInput, setSearchInput] = useState("");
    const groupId = groupInfo["group"]["group"]["group-id"]
    const groupMembersString = groupInfo["group"]["group"]["users"]
    const user = groupInfo["user"]
    console.log(groupInfo, "add user to group")
    useEffect(() => {
        fetch('http://localhost:8080/get-friends')
            .then(response => response.json())
            .then(data => {
                if (groupMembersString != "" || groupMembersString != null || groupMembersString.length === 0) {
                    groupMembers = groupMembersString.split(",")
                }
                let friends = []
                data.map(friend => {
                    if (!groupMembers.includes(friend)) {
                        friends.push({ name: friend, selected: false })
                    }
                })
                setFriends(friends)
            })
    }, [])

    const filteredFriends = friends.filter((checkbox) =>
        checkbox.name.toLowerCase().includes(searchInput.toLowerCase()))

    const handleFriendClick = (id) => {
        const updatedUsers = friends.map(member => {
            if (member.name === id) {
                return { ...member, selected: !member.selected };
            }
            return member
        });
        setFriends(updatedUsers);
    }

    // const handleUserSubmit = (evt) => {
    //     evt.preventDefault()
    //     let users = []
    //     friends.map(friend => {
    //         if (friend.selected) {
    //             users.push(friend.name)
    //             return
    //         }
    //     })
    //     let values= groupInfo["group"]["group"]
    //     values["users"]=users.join(',')
    //     console.log(values)

    //     // update group, if name was not there before-> send request
    //     // if name was removed-> remove user  prevent from adding to group
    //     groupInfo["socket"].send(JSON.stringify(values))
    // }


    return (
        <form className="group-members-form" >
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