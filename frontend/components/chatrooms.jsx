import React, { useState } from "react"
import { CreateChat } from "./chatroomForm"
import { ChatBox } from "./chatbox"

export const GetChat = () => {
    const [isPrivate, setIsPrivate] = useState(false)
    const [chats, setChats] = useState([])
    const [visible, setVisible] = useState(false)


    const displayPrivateChatRooms = (privateChat) => {
        if (privateChat) {
            fetch('http://localhost:8080/get-chatrooms')
                .then(response => response.json())
                .then(data => {
                    setChats(data)
                })
            setIsPrivate(true);
            console.log("private rooms", isPrivate, chats)
        } else {
            fetch('http://localhost:8080/get-chatrooms')
                .then(response => response.json())
                .then(data => {
                    setChats(data)
                })
            setIsPrivate(false);
            console.log("group rooms", isPrivate, chats)
        }
    }

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
                                            <ChatBox r={chat["chatroom-id"]} n={""} u={chat["users"]} t={isPrivate} />
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
                                            <ChatBox r={chat["chatroom-id"]} n={chat["chat-name"]} u={chat["users"]} t={isPrivate} />
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

            <button id="open-chat-button">
                <img src="../../public/assets/img/chats-icon.png" onClick={openChatRooms} alt="" />
            </button>
        </div>
    )
}