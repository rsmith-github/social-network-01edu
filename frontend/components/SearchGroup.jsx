import React, { useState, useEffect } from "react"

export const SearchGroupButton = (newGroup) => {
    const [visible, setVisible] = useState(false)
    const [errorMes, setErrorMes] = useState("")
    const [groups, setGroups] = useState([])
    const [searchInput, setSearchInput] = useState("");

    useEffect(() => {
        const getGroups = async () => {
            // Fetch users from "all users" api
            const getGroupsPromise = await fetch("http://localhost:8080/search-groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const newData = await getGroupsPromise.json();
            if (newData !== null && newData.length != 0)
                newData.sort((a, b) => a["group-name"].localeCompare(b["group-name"]))
            setGroups(newData)
        };
        if (visible)
            getGroups()
    }, [visible])

    let filteredGroups = []
    if (groups != null) {
        filteredGroups = groups.filter((group) =>
            group["group-name"].toLowerCase().includes(searchInput.toLowerCase()))
    }

    const openForm = () => {
        setVisible((prev) => !prev)
    };

    const closeForm = () => {
        setVisible((prev) => !prev)
    };

    const handleBrokenAuthImage = (source) => {
        if (source != "") {
            return source
        } else {
            return "https://www.transparentpng.com/thumb/user/gray-user-profile-icon-png-fP8Q1P.png"
        }
    }

    const handleGroupInvite = (evt) => {
        const data = new FormData(evt.target);
        let values = Object.fromEntries(data.entries())
        evt.preventDefault()
        fetch("http://localhost:8080/send-group-request", {
            method: "POST",
            header: { "Content-Type": "application/json" },
            body: values["group-id"]
        })
    }


    return (
        <>
            {visible &&
                <div className="create-post-container">
                    <div className="create-group-form">
                        <div className="create-group-posts-close-container">
                            <button className="close-button" type="button" onClick={closeForm}>
                                <span>&times;</span>
                            </button>
                            <h1>All Groups</h1>
                        </div>
                        <input type="text" className="search-friends" placeholder="Find Group" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
                        <div className="search-group-container">
                            {filteredGroups.length != 0 ? (
                                <>
                                    {filteredGroups.map(group => {
                                        return (
                                            <button type="button" className="search-group-post-button" >
                                                <div>
                                                    <img src={handleBrokenAuthImage(group["group-avatar"])} />
                                                    <p className="group-post-button-name">{group["group-name"]}</p>
                                                </div>
                                                <form className="send-group-invite" onSubmit={handleGroupInvite}>
                                                    <input type="hidden" name="group-id" value={group["group-id"]} />
                                                    <input type="submit" className="search-group-request-button" value="Send Request" />
                                                </form>
                                            </button>
                                        )
                                    }
                                    )}
                                </>

                            ) : (
                                <h2>No Groups To Join</h2>
                            )}

                        </div>
                        {errorMes &&
                            <p className="error-message">{errorMes}</p>
                        }
                    </div>
                </div>
            }
            <button type="button" className="search-group-button" onClick={openForm} >
                <img src="https://static.thenounproject.com/png/79381-200.png" />
            </button>
        </>
    )
}
