import React, { useState, useEffect } from "react";
import { CreateGroupButton } from "./CreateGroupButton";
import { GroupButton } from "./GroupButton";
import { SearchGroupButton } from "./SearchGroup";

export const GroupContainer = (props) => {
  const [loaded, setLoaded] = useState(false);
  const [groupArr, setGroupArr] = useState([]);
  useEffect(() => {
    if (props["groups"] != null && props["groups"] != undefined)
      setGroupArr(props["groups"]);
    setLoaded(true);
  }, [props["groups"]]);

  const newGroupCreated = (groupInfo) => {
    setGroupArr((groupRooms) => {
      if (
        Array.isArray(groupRooms) &&
        groupRooms.length !== 0 &&
        groupRooms !== null
      ) {
        return [groupInfo, ...groupRooms];
      } else {
        return [groupInfo];
      }
    });
  };

  const newPostAdded = (groupPostArr) => {
    setGroupArr((groups) => {
      const selectedGroupIndex = groups.findIndex(
        (group) => group["group-id"] === groupPostArr[0]["group-post-id"]
      );
      const firstItem = groups[selectedGroupIndex];
      console.log({ firstItem });
      if (selectedGroupIndex != -1) {
        groups.splice(selectedGroupIndex, 1);
        return [firstItem, ...groups];
      }
    });
  };

  return (
    <div className="group-posts-container">
      <div className="group-post-rooms">
        {loaded && (
          <>
            {groupArr.length > 0 && (
              <>
                {groupArr.map((group) => (
                  <>
                    <GroupButton
                      group={group}
                      socket={props.socket}
                      addedPost={newPostAdded}
                    />
                  </>
                ))}
              </>
            )}
          </>
        )}
      </div>
      <div className="create-group-button-container">
        <SearchGroupButton onSubmit={newGroupCreated} />
        <CreateGroupButton onSubmit={newGroupCreated} />
      </div>
    </div>
  );
};
