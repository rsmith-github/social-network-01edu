import React, { useState, useEffect } from "react"
import { CreateChat } from "./chatroomForm"
import { ChatBox } from "./chatbox"

export const GetChat = () => {
    const [isPrivate, setIsPrivate] = useState(false)
    const [chats, setChats] = useState([])
    const [openChatBox, setOpenChatBox] = useState(false)
    const [chatroom, setChatroom] = useState('')

    const openChatRoom = (chatroomId) => {
        setChatroom(chatroomId)
        setOpenChatBox(true)
    }

    const closeChatRoom = () => {
        setOpenChatBox((prev) => !prev)
    }

    const displayPrivateChatRooms = (privateChat) => {
        if (privateChat) {
            fetch('http://localhost:8080/get-chatrooms')
                .then(response => response.json())
                .then(data => {
                    setChats(data)
                })
            setIsPrivate(true);
        } else {
            fetch('http://localhost:8080/get-chatrooms')
                .then(response => response.json())
                .then(data => {
                    setChats(data)
                })
            setIsPrivate(false);
        }
    }

    const [visible, setVisible] = useState(false)
    const closeChatRooms = () => {
        setIsPrivate(false)
        setVisible((prev) => !prev)
    }
    const openChatRooms = () => {
        fetch('http://localhost:8080/get-chatrooms')
            .then(response => response.json())
            .then(data => {
                setChats(data)
            })
        setVisible((prev) => !prev)
    }


    return (
        <div className="open-chat">
            {visible &&
                <div className="open-chat-container">
                    <div className="open-chat-close-container">
                        <button className="open-chat-close-button" type="button" onClick={closeChatRooms}>
                            <span>&times;</span>
                        </button>
                        <h1>Chat Rooms</h1>
                        <CreateChat />
                    </div>
                    <div className="chatroom-type">
                        <div>
                            <input type="radio" name="chat-type" id="group" value="group" onChange={() => displayPrivateChatRooms(false)} defaultChecked />
                            <label htmlFor="group">Group</label>
                        </div>
                        <div>
                            <input type="radio" name="chat-type" id="private" value="private" onChange={() => displayPrivateChatRooms(true)} />
                            <label htmlFor="private">Private</label>
                        </div>
                    </div>
                    <div className="chatrooms">
                        {isPrivate ? (
                            <>
                                {chats["private-chatrooms"] ? (
                                    <>
                                        {chats["private-chatrooms"].map(chat =>
                                            <button onClick={() => openChatRoom(chat["chatroom-id"])}>
                                                <h2>{chat["users"]}</h2>
                                            </button>

                                        )}
                                    </>
                                ) : (
                                    <h1>No Private Chats Yet?</h1>
                                )
                                }

                            </>
                        ) : (
                            <>
                                {chats["group-chatrooms"] ? (
                                    <>
                                        {chats["group-chatrooms"].map(chat =>
                                            <button onClick={() => openChatRoom(chat["chatroom-id"])}>
                                                {chat["chat-name"] ? (
                                                    <h2>{chat["chat-name"]}</h2>
                                                ) : (
                                                    <p>{chat["users"]}</p>
                                                )}
                                                {/* {chat["chat-description"] ? (
                                                    <p>{chat["chat-description"]}</p>
                                                ) : (
                                                    <p>{chat["users"]}</p>
                                                )} */}
                                                <p>{chat["users"]}</p>
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <h1>No Group Chats</h1>
                                    </>
                                )
                                }
                            </>
                        )}
                    </div>

                </div>
            }
            {openChatBox && (
                <div className="chatbox-container">
                    <div className="chatbox-close-container">
                        <button className="chatbox-close-button" type="button" onClick={closeChatRoom}>
                            <span>&times;</span>
                        </button>
                    </div>
                    <ChatBox r={chatroom} />
                </div>
            )}

            <button id="open-chat-button">
                <img src="../../public/assets/img/chats-icon.png" onClick={openChatRooms} alt="" />
            </button>
        </div>
    )
}