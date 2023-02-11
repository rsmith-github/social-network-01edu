import React, { useState, useEffect, useRef } from "react"
import { EditChat } from "./chatroomForm"

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

    useEffect(() => {
        const fetchData = async () => {
            const receivedResponse = await fetch("http://localhost:8080/get-chat", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: (chatroomId)
            })
            const response = await receivedResponse.json()
            console.log(response)
            setUser(response["user"])
            setAdmin(response["chatroom"]["admin"])
            setMessages(response["previous-messages"])
            setChatName(response["chatroom"]["chat-name"])
            setChatDescription(response["chatroom"]["chat-description"])
            if (response["chatroom"]["chat-type"] == "group") {
                setPrivateChat(false)
            } else {
                setPrivateChat(true)
            }
            setChatUsers(response["chatroom"]["users"])
        }
        if (visible) {
            fetchData().then(() => {
                conn.current = new WebSocket("ws://" + document.location.host + "/ws/chat")
                console.log(conn.current)
                conn.current.onopen = () => {
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
        setVisible(false)
        setDescriptionBox(false)

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
        console.log(chatroomId)
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

    const handleChildDestroy = (name, description) => {
        setChatName(name)
        setChatDescription(description)
    };

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
                                    <button className="leave-group-button">Leave</button>
                                </>
                            ) : (
                                (admin === user) ? (
                                    <>
                                        <EditChat n={chatName} d={chatDescription} u={chatUsers} i={chatroomId} l={user} onDestroy={handleChildDestroy} />
                                        <button className="leave-group-button">Leave</button>
                                    </>
                                )
                                    : (
                                        <>
                                            <button className="leave-group-button">Leave</button>
                                        </>
                                    )

                            )}

                        </div>
                    </div>
                    <div className="chatbox-header-container">
                        {/* for chat images */}
                        {/* <img src="" alt="" srcset="" /> */}
                        {privateChat ? (
                            <div className="chat-info-private">
                                {/* Add image of group chat */}
                                <h1>{chatUsers}</h1>
                            </div>
                        ) : (
                            <>

                                <div className="chat-info-group">
                                    {/* Add image of chat */}
                                    <h1>{chatName}</h1>
                                    <h2 onClick={showDescriptionBox}>Description</h2>
                                    {/* <p>{chatUsers}</p> */}
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
                    <form method="post" className="message-form" onSubmit={handleMessageSubmit}>
                        <div className="message-textarea" contentEditable={true}>
                            <textarea name="message" className="message-text-input" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="For Emojis Press: 'Windows + ;' or 'Ctrl + Cmd + Space'" />
                        </div>
                        <input type="submit" value="Send" className="message-send-button" />
                    </form>

                </div>
            )
            }

            <button onClick={openChatRoom}>
                {response.t ? (
                    <h2>{response.u}</h2>
                ) : (
                    <>
                        <h2>{response.n}</h2>
                        <p>{response.u}</p>
                    </>
                )}

            </button>
        </>
    )
}