import React, { useState, useEffect } from "react"

export const ChatBox = (response) => {
    const [user, setUser] = useState('')
    const [privateChat, setPrivateChat] = useState(false)
    const [chatName, setChatName] = useState('')
    const [chatDescription, setChatDescription] = useState('')
    const [chatUsers, setChatUsers] = useState('')
    const [messages, setMessages] = useState([])
    const chatroomId = response.r

    fetch("http://localhost:8080/get-chat", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: (chatroomId)
    })
        .then(response => response.json())
        .then(response => {
            console.log(response)
            setUser(response["user"])
            setMessages(response["previous-messages"])
            setChatName(response["chatroom"]["chat-name"])
            setChatDescription(response["chatroom"]["chat-description"])
            if (response["chatroom"]["chat-type"] == "group") {
                console.log(response["chatroom"]["chat-type"])
                setPrivateChat(false)
            } else {
                console.log(response["chatroom"]["chat-type"])
                setPrivateChat(true)
            }
            setChatUsers(response["chatroom"]["users"])
            // console.log({ user }, { chatName }, { chatDescription },{chatType}, { chatUsers }, { messages })

            // add onopen, onmessage,onclose functions
            let conn = new WebSocket("ws://" + document.location.host + "/ws/chat")
        })





    return (
        <div className="chatbox">
            <div className="chatbox-header-container">
                {/* for chat images */}
                {/* <img src="" alt="" srcset="" /> */}
                {privateChat ? (
                    <>
                        <h1>{chatUsers}</h1>
                    </>
                ) : (
                    <>
                        <h1>{chatName}</h1>
                        <h2>{chatDescription}</h2>
                        <p>{chatUsers}</p>
                    </>
                )}

                {/* add plus icon and onclick function */}
                <button className="add-user">+</button>
                {/* add minus icon and onclick function */}
                <button className="remove-user">-</button>
            </div>
            <div className="previous-messages">
                {messages && (
                    <div className="chat-message" >
                        {messages.map(message => {
                            if (message["sender"] = user) {
                                // add green message
                            } else {
                                // add other colour message
                            }

                        })}
                    </div>
                )}
            </div>
            {/* add on submit function */}
            <form method="post">
                <input type="text" name="message" />
                <input type="submit" value="Send" />
            </form>
        </div>
    )
}