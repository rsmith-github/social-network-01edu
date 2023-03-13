import React, { useState, useEffect, StrictMode, useRef } from "react";
import { toast } from "react-toastify";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, json } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NavBar from "./components/Navbar";
import Profile from "./pages/Profile";
import PublicProfiles from "./pages/PublicProfiles";
import { injectStyle } from "react-toastify/dist/inject-style";
import {
  AddedGroupNotify,
  GroupPostNotify,
  RemoveGroupNotify,
  RequestNotify,
} from "./components/RequestNotify";

// CALL IT ONCE IN YOUR APP
injectStyle();

import Swal from "sweetalert2";

function App() {
  // Current user state vars.
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  // can probably merge with existing wSocket handler
  const websocket = useRef(null);

  // store current user
  const [user, setUser] = useState({});

  // All users state vars
  const [users, setUsers] = useState([]);

  const [groupArr, setGroupArr] = useState([]);

  const [followUpdate, setFollowUpdate] = useState(false);

  useEffect(() => {
    window.addEventListener("beforeunload", closeConnection);
    fetch("http://localhost:8080/create-group")
      .then((response) => response.json())
      .then((data) => {
        if (data != null && data != undefined) setGroupArr(data);
      });
    return () => {
      window.removeEventListener("beforeunload", closeConnection);
    };
  }, []);

  useEffect(() => {
    fetch("http://localhost:8080/create-group")
      .then((response) => response.json())
      .then((data) => {
        if (data != null && data != undefined) setGroupArr(data);
      });
  }, [name]);

  const customToastClose = ({ closeToast, type }) => {
    return (
      <i
        onClick={() => {
          let removeRequest = {};
          if (
            type.hasOwnProperty("notification-followRequest") &&
            type["notification-followRequest"] != null
          ) {
            removeRequest = {
              "remove-sender": `${type["notification-followRequest"]["followRequest-username"]}`,
              "remove-receiver": `${type["notification-followRequest"]["toFollow-username"]}`,
            };

            // console.log(
            //   "REMOVE REQUEST ************************",
            //   removeRequest
            // );
            // return;
          }
          if (
            type.hasOwnProperty("notification-groupRequest") &&
            type["notification-groupRequest"] != null
          ) {
            if (type["notification-groupRequest"]["action"] === "remove") {
              removeRequest = {
                "remove-sender": `${type["notification-groupRequest"]["admin"]}`,
                "remove-receiver": user.nickname,
                "remove-typeOfAction": "remove-group-request",
                "remove-groupId": `${type["notification-groupRequest"]["group-id"]}`,
              };
            } else {
              removeRequest = {
                "remove-sender": `${type["notification-groupRequest"]["admin"]}`,
                "remove-receiver": user.nickname,
                "remove-typeOfAction": "groupRequest",
                "remove-groupId": `${type["notification-groupRequest"]["group-id"]}`,
              };
            }
            // return;
          }
          if (
            type.hasOwnProperty("notification-group-action") &&
            type["notification-group-action"] != null
          ) {
            console.log(type);
            if (
              type["notification-group-action"]["action"] ===
              "accepted-group-request"
            ) {
              removeRequest = {
                "remove-sender": `${type["notification-group-action"]["user"]}`,
                "remove-receiver": user.nickname,
                "remove-typeOfAction": "accepted-group-request",
                "remove-groupId": `${type["notification-group-action"]["groupId"]}`,
              };
            } else if (
              type["notification-group-action"]["action"] ===
              "send-group-request"
            ) {
              removeRequest = {
                "remove-sender": `${type["notification-group-action"]["user"]}`,
                "remove-receiver": user.nickname,
                "remove-typeOfAction": "send-group-request",
                "remove-groupId": `${type["notification-group-action"]["groupId"]}`,
              };
            } else {
              removeRequest = {
                "remove-sender": `${type["notification-group-action"]["admin"]}`,
                "remove-receiver": user.nickname,
                "remove-typeOfAction": "remove-group-request",
                "remove-groupId": `${type["notification-group-action"]["groupId"]}`,
              };
            }
            // return;
          }

          if (user) {
            removeRequest["remove-receiver"] = `${user.nickname}`;
          }

          websocket.current.send(JSON.stringify(removeRequest));
          closeToast;
          console.log("sent", removeRequest);
        }}
        style={{
          marginRight: "5px",
        }}
      >
        x
      </i>
    );
  };

  const notify = (obj, ws) => {
    if (
      obj["notification-sender"] != "" &&
      obj["notification-sender"] !== undefined
    ) {
      toast(
        "🦄 " +
          `${obj["notification-numOfMessages"]}` +
          " message(s) from: " +
          `${obj["notification-sender"]}`,
        {
          data: {
            title: "messages",
          },
          autoClose: false,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        }
      );
      return;
    } else if (
      obj["group-post-id"] != "" &&
      obj["post-id"] != "" &&
      obj["group-post-id"] !== undefined &&
      obj["post-id"] !== undefined
    ) {
      toast(<GroupPostNotify type={obj} />, {
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      return;
    } else if (
      obj["notification-followRequest"] !== undefined &&
      obj["notification-followRequest"]["followRequest"] !== undefined &&
      obj["notification-followRequest"]["followRequest"] !== ""
    ) {
      toast(
        <RequestNotify
          type={obj["notification-followRequest"]}
          accepted={() => {
            let removeRequest = {
              "remove-sender": `${obj["notification-followRequest"]["followRequest-username"]}`,
              "remove-receiver": `${obj["notification-followRequest"]["toFollow-username"]}`,
            };
            //send to backend "followRequest:accepted" so it can broadcast and go to the else condition in client's "followMessage" switch case.
            const follow = {
              followRequest: `${obj["notification-followRequest"]["followRequest"]}`,
              toFollow: `${obj["notification-followRequest"]["toFollow"]}`,
              isFollowing: true,
              followers: obj["notification-followRequest"]["followers"],
              "followRequest-accepted": true,
            };
            ws.send(JSON.stringify(follow));
            ws.send(JSON.stringify(removeRequest));
          }}
        />,
        {
          autoClose: false,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          closeButton: ({ closeToast }) => {
            return (
              <i
                onClick={() => {
                  let removeRequest = {
                    "remove-sender": `${obj["notification-followRequest"]["followRequest-username"]}`,
                    "remove-receiver": `${obj["notification-followRequest"]["toFollow-username"]}`,
                  };
                  ws.send(JSON.stringify(removeRequest));
                  closeToast;
                }}
                style={{}}
              >
                x
              </i>
            );
          },
        }
      );
      return;
    } else if (
      obj["notification-groupRequest"] !== undefined &&
      obj["notification-groupRequest"]["group-id"] !== undefined &&
      obj["notification-groupRequest"]["group-id"] !== ""
    ) {
      if (obj["notification-groupRequest"]["action"] == "remove") {
        toast(<RemoveGroupNotify type={obj["notification-groupRequest"]} />, {
          autoClose: false,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          closeButton: ({ closeToast }) => {
            return (
              <i
                onClick={() => {
                  let removeRequest = {
                    "remove-sender": `${obj["notification-groupRequest"]["admin"]}`,
                    "remove-receiver": `${obj["notification-groupRequest"]["users"]}`,
                    "remove-typeOfAction": "remove-group-request",
                    "remove-groupId": `${obj["notification-groupRequest"]["group-id"]}`,
                  };
                  ws.send(JSON.stringify(removeRequest));
                  closeToast;
                }}
                style={{}}
              >
                x
              </i>
            );
          },
        });
        return;
      } else {
        toast(
          <RequestNotify
            type={obj["notification-groupRequest"]}
            accepted={async () => {
              const responseFromAddingMember = fetch(
                "http://localhost:8080/add-group-member",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: obj["notification-groupRequest"]["group-id"],
                }
              );
              let response = await (await responseFromAddingMember).text();
              if (response === "accepted") {
                setGroupArr((groupRooms) => {
                  if (groupRooms !== null && groupRooms.length > 0) {
                    return [...groupRooms, obj["notification-groupRequest"]];
                  } else {
                    return [obj["notification-groupRequest"]];
                  }
                });
              }
              let removeRequest = {
                "remove-sender": `${obj["notification-groupRequest"]["admin"]}`,
                "remove-receiver": `${obj["notification-groupRequest"]["users"]}`,
                "remove-typeOfAction": "groupRequest",
                "remove-groupId": `${obj["notification-groupRequest"]["group-id"]}`,
              };
              ws.send(JSON.stringify(removeRequest));
            }}
          />,
          {
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
            closeButton: ({ closeToast }) => {
              return (
                <i
                  onClick={() => {
                    //sends in a requestNotificationJson to remove the request from the sql table, this will go to the client's "RequestNotification" switch case.
                    let removeRequest = {
                      "remove-sender": `${obj["notification-groupRequest"]["admin"]}`,
                      "remove-receiver": `${obj["notification-groupRequest"]["users"]}`,
                      "remove-typeOfAction": "groupRequest",
                      "remove-groupId": `${obj["notification-groupRequest"]["group-id"]}`,
                    };
                    ws.send(JSON.stringify(removeRequest));
                    closeToast;
                  }}
                  style={{}}
                >
                  x
                </i>
              );
            },
          }
        );
        return;
      }
    } else if (obj["notification-group-action"] !== undefined) {
      if (
        obj["notification-group-action"]["action"] == "accepted-group-request"
      ) {
        toast(<AddedGroupNotify type={obj["notification-group-action"]} />, {
          autoClose: false,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          closeButton: ({ closeToast }) => {
            return (
              <i
                onClick={() => {
                  let removeRequest = {
                    "remove-sender": `${obj["notification-group-action"]["user"]}`,
                    "remove-receiver": `${obj["notification-groupRequest"]["admin"]}`,
                    "remove-typeOfAction": "accepted-group-request",
                    "remove-groupId": `${obj["notification-group-action"]["groupId"]}`,
                  };
                  ws.send(JSON.stringify(removeRequest));
                  closeToast;
                }}
                style={{}}
              >
                x
              </i>
            );
          },
        });
        return;
      } else if (
        obj["notification-group-action"]["action"] == "send-group-request"
      ) {
        toast(
          <AddedGroupNotify
            type={obj["notification-group-action"]}
            accepted={() => {
              setGroupArr((groups) => {
                const selectedGroup = groups.find(
                  (group) =>
                    group["group-id"] ===
                    obj["notification-group-action"]["groupId"]
                );
                console.log({ selectedGroup });
                if (selectedGroup != undefined) {
                  let values = selectedGroup;
                  values["users"] = obj["notification-group-action"]["user"];
                  values["action"] = "add user";
                  ws.send(JSON.stringify(values));
                  let removeRequest = {
                    "remove-sender": `${obj["notification-group-action"]["user"]}`,
                    "remove-receiver": `${obj["notification-group-action"]["admin"]}`,
                    "remove-typeOfAction": "send-group-request",
                    "remove-groupId": `${obj["notification-group-action"]["groupId"]}`,
                  };
                  ws.send(JSON.stringify(removeRequest));
                  return [...groups];
                }
              });
            }}
          />,
          {
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "dark",
            closeButton: ({ closeToast }) => {
              return (
                <i
                  onClick={() => {
                    let removeRequest = {
                      "remove-sender": `${obj["notification-group-action"]["user"]}`,
                      "remove-receiver": `${obj["notification-group-action"]["admin"]}`,
                      "remove-typeOfAction": "send-group-request",
                      "remove-groupId": `${obj["notification-group-action"]["groupId"]}`,
                    };
                    ws.send(JSON.stringify(removeRequest));
                    closeToast;
                  }}
                  style={{}}
                >
                  x
                </i>
              );
            },
          }
        );
      } else {
        toast(<AddedGroupNotify type={obj["notification-group-action"]} />, {
          autoClose: false,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          closeButton: ({ closeToast }) => {
            return (
              <i
                onClick={() => {
                  let removeRequest = {
                    "remove-sender": `${obj["notification-group-action"]["admin"]}`,
                    "remove-receiver": user.nickname,
                    "remove-typeOfAction": "remove-group-request",
                    "remove-groupId": `${obj["notification-group-action"]["groupId"]}`,
                  };
                  ws.send(JSON.stringify(removeRequest));
                  closeToast;
                  console.log("sent", removeRequest);
                }}
                style={{}}
              >
                x
              </i>
            );
          },
        });
        return;
      }
    }
  };

  // Open websocket connection
  const openConnection = (name, usr) => {
    return new Promise((resolve) => {
      if (websocket.current === null && name !== undefined && name !== "") {
        websocket.current = new WebSocket(
          "ws://" + document.location.host + "/ws/user"
        );
        websocket.current.onmessage = (event) => {
          let msg = JSON.parse(event.data);

          console.log(msg, "this is the message boy......");
          if (Array.isArray(msg)) {
            msg.map((notif) => {
              notify(notif, websocket.current);
            });
          } else {
            notify(msg, websocket.current);
          }
          if (
            msg.hasOwnProperty("notification-groupRequest") &&
            msg["notification-groupRequest"]["action"] == "remove"
          ) {
            setGroupArr((groups) => {
              const selectedGroupIndex = groups.findIndex(
                (group) =>
                  group["group-id"] ===
                  msg["notification-groupRequest"]["group-id"]
              );
              if (selectedGroupIndex != -1) {
                groups.splice(selectedGroupIndex, 1);
                return [...groups];
              }
            });
          }
          if (
            msg.hasOwnProperty("group-post-id") &&
            msg.hasOwnProperty("post-id")
          ) {
            if (document.getElementById(msg["group-post-id"]) == undefined) {
              setGroupArr((groups) => {
                const selectedGroupIndex = groups.findIndex(
                  (group) => group["group-id"] === msg["group-post-id"]
                );
                const firstItem = groups[selectedGroupIndex];
                if (selectedGroupIndex != -1) {
                  groups.splice(selectedGroupIndex, 1);
                  return [firstItem, ...groups];
                }
              });
            }
          }
          if (msg.hasOwnProperty("followRequest")) {
            if (msg["followRequest-username"] == usr.nickname) {
              setFollowUpdate(true);
            }
          }
          if (msg.toFollow === usr.email) {
            // Send message to relevant user according to isFollowing true or false.
            if (msg.isFollowing) {
              // Sweet Alert notification
              Swal.fire({
                title: "New follower:",
                text: msg.followRequest + " just followed you",
                icon: "info",
                confirmButtonText: "OK",
              });
              fetchUsersData();
            } else {
              // Sweet Alert notification
              Swal.fire({
                title: "Update:",
                text: msg.followRequest + " unfollowed you",
                icon: "info",
                confirmButtonText: "OK",
              });
            }
          }
          // fetch user data
          fetchUsersData();
        };
      } else {
        if (websocket.current !== null) {
          resolve("connection open");
        }
      }
    });
  };

  const closeConnection = () => {
    if (websocket.current !== null) {
      websocket.current.close(1000, "user refreshed or logged out.");
      websocket.current = null;
    }
  };

  const fetchData = async () => {
    // validate user based on session.
    const response = await fetch("http://localhost:8080/api/user", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const content = await response.json(); //getting current user.

    // Set user details
    setName(content.first);
    setAvatar(content.avatar);

    // Format user data to store in state variable.
    const user = {
      email: content.email,
      last: content.last,
      dob: content.dob,
      nickname: content.nickname,
      aboutme: content.about,
      followers: content.followers,
      following: content.following,
      status: content.status,
    };
    setUser(user);

    // try to connect user to websocket.
    openConnection(name, user); // from Abdul PR merge 7 March 2023
    // handleWSocket(user); // works here
    // openConnection(name);
  };

  useEffect(() => {
    fetchData();
  }, [name, users]); // fetch users data again when users have been updated, after follow. name var is for login.

  // Fetch users from api. Fetches whenever there is a follow request.
  const fetchUsersData = async () => {
    // Fetch users from "all users" api
    const usersPromise = await fetch("http://localhost:8080/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const usersJson = await usersPromise.json(); //getting current user.
    setUsers(usersJson);
  };

  // Fetch users data (followers, following etc.)
  useEffect(() => {
    fetchUsersData();
  }, []);

  useEffect(() => {
    fetch("http://localhost:8080/create-group")
      .then((response) => response.json())
      .then((data) => {
        if (data !== null && data !== undefined) setGroupArr(data);
      });
  }, [name]);

  const fetchRequestData = async (ws) => {
    const response = await fetch("http://localhost:8080/get-requests", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const response2 = await fetch(
      "http://localhost:8080/get-chat-notifications",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    const chatNotifArray = await response2.json();
    const requestsArray = await response.json();

    if (Array.isArray(chatNotifArray)) {
      chatNotifArray.map((obj) => {
        notify(obj, websocket.current);
      });
    } else {
      console.log(chatNotifArray);
    }
    if (Array.isArray(requestsArray)) {
      requestsArray.map((obj) => {
        notify(obj, ws);
      });
    } else {
      console.log(requestsArray);
    }
  };

  return (
    // <StrictMode>
    <BrowserRouter>
      <NavBar name={name} setName={setName} closeConn={closeConnection} />
      <Routes>
        <Route
          index
          element={
            <Home
              name={name}
              avatar={avatar}
              user={user}
              fetchUsersData={fetchUsersData}
              fetchData={fetchData}
              groups={groupArr}
              socket={websocket.current}
              fetchRequestData={fetchRequestData}
            />
          }
        />
        <Route path="/login" element={<Login setName={setName} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profile/"
          element={
            <Profile
              name={name}
              avatar={avatar}
              user={user}
              fetchUsersData={fetchUsersData}
              setUser={setUser}
            />
          }
        />
        <Route
          path="/public-profiles"
          element={
            <PublicProfiles
              users={users}
              socket={websocket.current} // Socket 1
              // socket={wSocket} // Socket 2
              user={user}
              fetchUsersData={fetchUsersData}
              update={followUpdate}
              setUpdate={setFollowUpdate}
            />
          }
        />
      </Routes>
    </BrowserRouter>
    // </StrictMode>
  );
}

const root = ReactDOM.createRoot(document.getElementById("app"));

root.render(<App />);
