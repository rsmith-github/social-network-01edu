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

  const RequestNotify = ({ type, accepted }) => {
    const [message, setMessage] = useState("");
    const handleAccepted = () => {
      accepted();
    };
    useEffect(() => {
      if (type.hasOwnProperty("group-id")) {
        let str =
          `${type["admin"]}` +
          " Would Like You To Join " +
          `${type["group-name"]}`;
        setMessage(str);
      } else if (type.hasOwnProperty("followRequest")) {
        let str =
          `${type["followRequest-username"]}` + " Would Like To Follow You";
        setMessage(str);
      }
    }, [type]);

    return (
      <div>
        <p>{message}</p>
        <button className="button-85" onClick={handleAccepted}>
          Accept
        </button>
      </div>
    );
  };
  const closeNotification = () => {};
  const notify = (obj, ws) => {
    if (
      obj["notification-sender"] != "" &&
      obj["notification-sender"] !== undefined
    ) {
      toast("🦄 message from: " + `${obj["notification-sender"]}`, {
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      return;
    } else if (
      obj["notification-followRequest"] !== undefined &&
      obj["notification-followRequest"]["toFollow"] !== "" &&
      obj["notification-followRequest"]["toFollow"] !== undefined
    ) {
      toast(
        <RequestNotify
          type={obj["notification-followRequest"]}
          accepted={() => {
            //sends in a requestNotificationJson to remove the request from the sql table, this will go to the client's "RequestNotification" switch case.
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
          onClose: () => {
            let removeRequest = {
              "remove-sender": `${obj["notification-followRequest"]["followRequest-username"]}`,
              "remove-receiver": `${obj["notification-followRequest"]["toFollow-username"]}`,
            };
            ws.send(JSON.stringify(removeRequest));
            console.log("sent", removeRequest);
          },
        }
      );
    } else if (
      obj["notification-groupRequest"] !== undefined &&
      obj["notification-groupRequest"]["group-id"] !== "" &&
      obj["notification-groupRequest"]["group-id"] !== undefined
    ) {
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
                if (Array.isArray(groupRooms) && groupRooms.length === 0) {
                  return [obj["notification-groupRequest"]];
                } else {
                  return [...groupRooms, obj["notification-groupRequest"]];
                }
              });
            }
            //sends in a requestNotificationJson to remove the request from the sql table, this will go to the client's "RequestNotification" switch case.
            let removeRequest = {
              "remove-sender": `${obj["notification-groupRequest"]["admin"]}`,
              "remove-receiver": user.nickname,
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
          onClose: () => {
            let removeRequest = {
              "remove-sender": `${obj["notification-groupRequest"]["admin"]}`,
              "remove-receiver": user.nickname,
              "remove-groupId": `${obj["notification-groupRequest"]["group-id"]}`,
            };
            ws.send(JSON.stringify(removeRequest));
            console.log("sent", removeRequest);
          },
        }
      );
    }
  };

  const openConnection = (name, usr) => {
    if (websocket.current === null && name !== undefined && name !== "") {
      websocket.current = new WebSocket(
        "ws://" + document.location.host + "/ws/user"
      );
      websocket.current.onopen = () => {
        console.log("user connection open");
      };
      websocket.current.onmessage = (event) => {
        let msg = JSON.parse(event.data);
        console.log(msg, "this is msg.");
        if (Array.isArray(msg)) {
          msg.map((notif) => {
            notify(notif, websocket.current);
          });
        } else {
          notify(msg, websocket.current);
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
    }
  };

  const closeConnection = () => {
    if (websocket.current !== null) {
      websocket.current.close(1000, "user refreshed or logged out.");
      websocket.current = null;
    }
  };

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

  useEffect(() => {
    fetch("http://localhost:8080/create-group")
      .then((response) => response.json())
      .then((data) => {
        if (data != null && data != undefined) setGroupArr(data);
      });
  }, [name]);

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
              groups={groupArr}
              socket={websocket.current}
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
