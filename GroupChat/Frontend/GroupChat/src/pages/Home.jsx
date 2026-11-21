import { useEffect, useState } from "react";
import axios from "axios";
import ChatWindow from "./ChatWindow";
import "../styles/Home.css";

axios.defaults.withCredentials = true;

const CREATE_GROUP = "http://localhost:3000/groupChat/group/createGroup"; // POST
const JOIN_GROUP = "http://localhost:3000/groupChat/group/joinGroup"; // POST
const FETCH_GROUPS = "http://localhost:3000/groupChat/group/fetchGroups"; // GET
const FETCH_ALL_GROUPS = "http://localhost:3000/groupChat/group/fetchAllGroups"; // GET
const FETCH_USERS = "http://localhost:3000/groupChat/user/fetchUsers"; // POST
const FETCH_EXISTING_USERS = "http://localhost:3000/groupChat/user/fetchExistingUsers"; // GET

const SEARCH_DELAY = 300; // ms to wait after the last keystroke

const TABS = [
  { key: "joined", label: "My Groups" },
  { key: "join", label: "Join Groups" },
  { key: "create", label: "Create Group" },
  { key: "message", label: "Message User" },
];

function Home() {
  const [tab, setTab] = useState("joined");
  const [groups, setGroups] = useState([]); // groups the user has joined
  const [allGroups, setAllGroups] = useState([]); // every group
  const [groupName, setGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null); // group waiting for the join confirmation
  const [openGroup, setOpenGroup] = useState(null); // chat that is open: a joined group, or a user (isPersonal)
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }
  const [email, setEmail] = useState(""); // text typed in the user search box
  const [users, setUsers] = useState([]); // search results: [{ id, username, email }]
  const [existingUsers, setExistingUsers] = useState([]); // existing users: [{ id, username }]
  const [searched, setSearched] = useState(false); // true once a search has returned

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

  // Response shape: { userList: [{ id, username }] }
  async function fetchExistingUsers() {
    try {
      const response = await axios.get(FETCH_EXISTING_USERS);
      setExistingUsers(response.data.userList ?? []);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Could not load the users",
      });
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

  // Opens a personal chat. The receiver's userId is passed as the groupId.
  function openPersonalChat(user) {
    setOpenGroup({
      groupId: user.id,
      groupName: user.username,
      isPersonal: true,
    });
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  // Debounced user search. Runs only while the Message User tab is open.
  // Response shape: { users: [{ id, username, email }] }
  useEffect(() => {
    if (tab !== "message") return;

    const q = email.trim();
    setSearched(false);

    if (!q) {
      setUsers([]);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const response = await axios.post(FETCH_USERS, { email: q });
        if (cancelled) return; // a newer search has started, ignore this result
        setUsers(response.data.users ?? []);
        setSearched(true);
      } catch (err) {
        if (cancelled) return;
        setUsers([]);
        setMessage({
          type: "error",
          text: err.response?.data?.message || "Could not search for users",
        });
      }
    }, SEARCH_DELAY);

    // Runs on the next keystroke or when the tab closes: cancels the pending search
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [email, tab]);

  // A group or a user was clicked: show its chat instead of the groups page
  if (openGroup) {
    return <ChatWindow group={openGroup} onBack={() => setOpenGroup(null)} />;
  }

  // My Groups shows the joined groups. Join Groups shows the rest.
  const list =
    tab === "joined"
      ? groups
      : allGroups.filter((g) => !groups.some((j) => j.groupId === g.groupId));

  // Message User tab: existing users while the box is empty, search results once typing
  const showExisting = !email.trim();
  const shownUsers = showExisting ? existingUsers : users;

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
                if (t.key === "message") {
                  setEmail("");
                  setUsers([]);
                  setSearched(false);
                  fetchExistingUsers();
                }
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
          ) : tab === "message" ? (
            <>
              <div className="groups-form">
                <label htmlFor="userEmail">Email ID</label>
                <input
                  id="userEmail"
                  type="text"
                  placeholder="Search by email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {shownUsers.length > 0 ? (
                <ul className="groups-list">
                  {shownUsers.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        className="groups-item"
                        style={{ "--hue": (u.username.charCodeAt(0) * 37) % 360 }}
                        onClick={() => openPersonalChat(u)}
                      >
                        <div className="groups-avatar" aria-hidden="true">
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="groups-name">{u.username}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="groups-empty">
                  {showExisting
                    ? "No existing users yet."
                    : searched
                    ? "No users found."
                    : "Searching..."}
                </p>
              )}
            </>
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