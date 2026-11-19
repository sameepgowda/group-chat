import { useEffect, useState } from "react";
import axios from "axios";
import ChatWindow from "./ChatWindow";
import "../styles/Home.css";

axios.defaults.withCredentials = true;

const CREATE_GROUP = "http://localhost:3000/groupChat/group/createGroup"; // POST
const JOIN_GROUP = "http://localhost:3000/groupChat/group/joinGroup"; // POST
const FETCH_GROUPS = "http://localhost:3000/groupChat/group/fetchGroups"; // GET
const FETCH_ALL_GROUPS = "http://localhost:3000/groupChat/group/fetchAllGroups"; // GET

const TABS = [
  { key: "joined", label: "My Groups" },
  { key: "join", label: "Join Groups" },
  { key: "create", label: "Create Group" },
];

function Home() {
  const [tab, setTab] = useState("joined");
  const [groups, setGroups] = useState([]); // groups the user has joined
  const [allGroups, setAllGroups] = useState([]); // every group
  const [groupName, setGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null); // group waiting for the join confirmation
  const [openGroup, setOpenGroup] = useState(null); // joined group whose chat is open
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }

  async function fetchGroups() {
    try {
      const response = await axios.get(FETCH_GROUPS);
      // Response shape: { groups: [{ groupId, groupName }] }
      setGroups(response.data.groups ?? []);
    } catch (err) {
      console.log(err);
    }
  }

  async function fetchAllGroups() {
    try {
      const response = await axios.get(FETCH_ALL_GROUPS);
      const data = response.data;

      // Accepts [...] directly, or an object holding the array, like { groups: [...] }
      setAllGroups(
        Array.isArray(data) ? data : Object.values(data).find(Array.isArray) ?? []
      );
    } catch (err) {
      setMessage({ type: "error", text: "Could not load the groups" });
    }
  }

  async function createGroup(e) {
    e.preventDefault();

    try {
      await axios.post(CREATE_GROUP, { groupName: groupName.trim() });
      setGroupName("");
      setMessage({ type: "success", text: "Group created" });
      fetchGroups();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Could not create the group",
      });
    }
  }

  async function joinGroup(group) {
    try {
      await axios.post(JOIN_GROUP, { groupId: group.groupId });
      setGroups([...groups, group]); // moves it to My Groups straight away
      setMessage({ type: "success", text: `You joined ${group.groupName}` });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Could not join the group",
      });
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  // A joined group was clicked: show its chat instead of the groups page
  if (openGroup) {
    return <ChatWindow group={openGroup} onBack={() => setOpenGroup(null)} />;
  }

  // My Groups shows the joined groups. Join Groups shows the rest.
  const list =
    tab === "joined"
      ? groups
      : allGroups.filter((g) => !groups.some((j) => j.groupId === g.groupId));

  return (
    <div className="groups-page">
      <section className="groups-card">
        <header className="groups-header">
          <div className="groups-mark" aria-hidden="true" />
          <div>
            <h1>Your groups</h1>
            <p>Join a conversation or start your own</p>
          </div>
        </header>

        <nav className="groups-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={tab === t.key ? "active" : ""}
              onClick={() => {
                setTab(t.key);
                setMessage(null);
                if (t.key === "joined") fetchGroups();
                if (t.key === "join") fetchAllGroups();
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {message && (
          <p className={`groups-message ${message.type}`} role="status">
            {message.text}
          </p>
        )}

        <div className="groups-body" role="tabpanel">
          {tab === "create" ? (
            <form className="groups-form" onSubmit={createGroup}>
              <label htmlFor="groupName">Group name</label>
              <input
                id="groupName"
                type="text"
                placeholder="Enter a group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
              <button type="submit" disabled={!groupName.trim()}>
                Create Group
              </button>
            </form>
          ) : list.length === 0 ? (
            <p className="groups-empty">
              {tab === "joined"
                ? "You haven't joined any groups yet."
                : "There are no groups to join right now."}
            </p>
          ) : (
            <ul className="groups-list">
              {list.map((g) => (
                <li key={g.groupId}>
                  <button
                    className="groups-item"
                    style={{ "--hue": (g.groupName.charCodeAt(0) * 37) % 360 }}
                    onClick={() =>
                      tab === "join" ? setSelectedGroup(g) : setOpenGroup(g)
                    }
                  >
                    <div className="groups-avatar" aria-hidden="true">
                      {g.groupName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="groups-name">{g.groupName}</span>
                    {tab === "join" && (
                      <span className="groups-join-label">Join</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {selectedGroup && (
        <div
          className="groups-backdrop"
          onClick={(e) => e.target === e.currentTarget && setSelectedGroup(null)}
        >
          <div
            className="groups-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-title"
          >
            <h2 id="join-title">Join {selectedGroup.groupName}?</h2>
            <p>You will be able to chat with everyone in this group.</p>

            <div className="groups-modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setSelectedGroup(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  joinGroup(selectedGroup);
                  setSelectedGroup(null);
                }}
              >
                Yes, join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;