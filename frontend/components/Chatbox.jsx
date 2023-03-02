import React, { useState, useEffect, useRef } from "react"
import { EditChat } from "./EditChatRoomForm"

export const ChatBox = (response) => {
    const [visible, setVisible] = useState(false)
    const [user, setUser] = useState('')
    const [admin, setAdmin] = useState('')
    const [privateChat, setPrivateChat] = useState(false)
    const [chatName, setChatName] = useState('')
    const [chatDescription, setChatDescription] = useState('')
    const [descriptionBox, setDescriptionBox] = useState(false)
    const [chatUsers, setChatUsers] = useState('')
    const [emoji, setEmoji] = useState("");
    const [messages, setMessages] = useState(null)
    const conn = useRef(null)
    const chatroomId = response.r
    const chatImg = response.i
    console.log({ chatImg })

    useEffect(() => {
        const fetchData = async () => {
            const receivedResponse = await fetch("http://localhost:8080/get-chat", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: (chatroomId)
            })
            const response2 = await receivedResponse.json()
            console.log(response2)
            setUser(response2["user"])
            setAdmin(response2["chatroom"]["admin"])
            setMessages(response2["previous-messages"])
            setChatName(response2["chatroom"]["chat-name"])
            setChatDescription(response2["chatroom"]["chat-description"])
            if (response2["chatroom"]["chat-type"] == "group") {
                setPrivateChat(false)
            } else {
                setPrivateChat(true)
            }
            setChatUsers(response2["chatroom"]["users"])
            return response2
        }
        if (visible) {
            fetchData().then((resp) => {
                conn.current = new WebSocket("ws://" + document.location.host + "/ws/chat")
                console.log(conn.current)
                conn.current.onopen = () => {
                    //create notification object
                    let updateNotif = {
                        "notification-chatId" : chatroomId,
                        "notification-receiver" : resp.user,
                    }
                    conn.current.send(JSON.stringify(updateNotif)) 
                    console.log("Chat box connection open")
                }
                conn.current.onmessage = (evt) => {
                    evt.preventDefault()
                    let incomingMessage = JSON.parse(evt.data)
                    console.log({ incomingMessage })
                    setMessages(messages => {
                        if (messages !== null) {
                            return [...messages, incomingMessage]
                        } else {
                            return [incomingMessage]
                        }
                    })
                }

            })

            return () => {
                console.log('user close chat')
                conn.current.close(1000, "user closed chat.")
            }
        }
    }, [visible])


    const closeChatRoom = () => {
        response["onClose"]()
        setDescriptionBox(false)
        setVisible(false)


    }
    const openChatRoom = () => {
        setVisible((prev) => !prev)
    }

    const showDescriptionBox = () => {
        setDescriptionBox((prev) => !prev)
    }


    const handleMessageSubmit = (evt) => {
        evt.preventDefault()
        const data = new FormData(evt.target);
        let values = Object.fromEntries(data.entries())
        console.log(values)
        if (values["message"] != "") {
            let msgSend = {
                "sender": user,
                "date": new Date().getTime(),
                "message": values["message"],
                "id": chatroomId
            }
            setEmoji('')
            if (conn.current != undefined) {
                console.log(msgSend)
                conn.current.send(JSON.stringify(msgSend))

            } else {
                console.log("no connection")
            }
        }
    }

    const handleChatroomChange = (name, description, users) => {
        setChatName(name)
        setChatDescription(description)
        setChatUsers(users)
    };

    const leaveChat = () => {
        console.log(user, "left the chat")
        const values = { "action": "leave", "chatroom-id": chatroomId }
        fetch("http://localhost:8080/edit-chatroom", {
            method: "POST",
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify(values),
        }).then(response => response.json())
            .then((response) => {
                console.log(response)
                closeChatRoom()
            })

    }

    const handleBrokenAuthImage = (source) => {
        if (source != "") {
            return source
        } else {
            return "https://www.transparentpng.com/thumb/user/gray-user-profile-icon-png-fP8Q1P.png"
        }
    }

    return (
        <>
            {visible && (
                <div className="chatbox-container">
                    <div className="chatbox-close-container">
                        <button className="chatbox-close-button" type="button" onClick={closeChatRoom}>
                            <span>&lt;</span>
                        </button>
                        <div className="chat-buttons">
                            {privateChat ? (
                                <>
                                    <button className="leave-group-button" type="button" onClick={leaveChat}>Leave</button>
                                </>
                            ) : (
                                (admin === user) ? (
                                    <>
                                        <h2 className="chat-description-button" onClick={showDescriptionBox}>Description</h2>
                                        <EditChat n={chatName} d={chatDescription} u={chatUsers} i={chatroomId} l={user} change={handleChatroomChange} img={chatImg} />
                                        <button className="leave-group-button" onClick={leaveChat}>Leave</button>
                                    </>
                                )
                                    : (
                                        <>
                                            <h2 className="chat-description-button" onClick={showDescriptionBox}>Description</h2>
                                            <button className="leave-group-button" type="button" onClick={leaveChat}>Leave</button>
                                        </>
                                    )
                            )}

                        </div>
                    </div>
                    <div className="chatbox-header-container">
                        {privateChat ? (
                            <div className="chat-info-private">
                                <img src={handleBrokenAuthImage(chatImg)} />
                                <h1>{chatUsers}</h1>
                            </div>
                        ) : (
                            <>

                                <div className="chat-info-group">
                                    <img src={handleBrokenAuthImage(chatImg)} />
                                    <h1>{chatName}</h1>
                                    {/* <h2 onClick={showDescriptionBox}>Description</h2> */}
                                </div>
                                {descriptionBox && (
                                    <div className="chat-info-description" >
                                        {chatDescription ? (
                                            <>
                                                {chatDescription}
                                            </>

                                        ) : (
                                            <>No Description Given</>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                    </div>
                    <div className="previous-messages">
                        {messages ? (
                            <>
                                {messages.map(message => {
                                    if (message["sender"] == user) {
                                        return (
                                            <div className="chat-message-sender" >
                                                <p className="chat-time">{new Date(message["date"]).toLocaleString()}</p>
                                                <p className="chat-message">{message["message"]}</p>
                                                <p className="chat-author">{message["sender"]}</p>
                                            </div>
                                        )

                                    } else {
                                        return (
                                            <div className="chat-message-receiver" >
                                                <p className="chat-time">{new Date(message["date"]).toLocaleString()}</p>
                                                <p className="chat-message">{message["message"]}</p>
                                                <p className="chat-author">{message["sender"]}</p>
                                            </div>
                                        )
                                    }

                                })
                                }
                            </>
                        ) : (
                            <div className="no-previous-messages">
                                <h2>Be the first to send a message</h2>
                            </div>
                        )}
                    </div>
                    <form className="message-form" onSubmit={handleMessageSubmit}>
                        <textarea name="message" contentEditable={true} className="message-text-input" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="For Emojis Press: 'Windows + ;' or 'Ctrl + Cmd + Space'" />
                        <input type="submit" value="Send" className="message-send-button" />
                    </form>

                </div>
            )
            }

            <button onClick={openChatRoom}>
                {response.t ? (
                    <div className="private-button">
                        <img src={handleBrokenAuthImage(chatImg)} />
                        <h2>{response.u}</h2>
                    </div>
                ) : (
                    <>
                        <div className="group-button">
                            <img src={handleBrokenAuthImage(chatImg)} />
                            <h2>{response.n}</h2>
                            <p>{response.u}</p>
                        </div>
                    </>
                )}

            </button>
        </>
    )
}