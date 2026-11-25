
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import ChatWindow from "./ChatWindow";
import "../styles/Home.css";

axios.defaults.withCredentials = true;

const CREATE_GROUP = "http://localhost:3000/groupChat/group/createGroup";
const JOIN_GROUP = "http://localhost:3000/groupChat/group/joinGroup";
const FETCH_GROUPS = "http://localhost:3000/groupChat/group/fetchGroups";
const FETCH_ALL_GROUPS = "http://localhost:3000/groupChat/group/fetchAllGroups";
const FETCH_USERS = "http://localhost:3000/groupChat/user/fetchUsers";
const FETCH_EXISTING_USERS = "http://localhost:3000/groupChat/user/fetchExistingUsers";

const SEARCH_DELAY = 300;
const SOCKET_URL = "http://localhost:3000";

const TABS = [
    { key: "joined", label: "My Groups" },
    { key: "join", label: "Join Groups" },
    { key: "create", label: "Create Group" },
    { key: "message", label: "Message User" },
];

function Home() {
    const [tab, setTab] = useState("joined");
    const [groups, setGroups] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [openGroup, setOpenGroup] = useState(null);
    const [message, setMessage] = useState(null);
    const [email, setEmail] = useState("");
    const [users, setUsers] = useState([]);
    const [existingUsers, setExistingUsers] = useState([]);
    const [searched, setSearched] = useState(false);

    // Notification toast state
    const [toast, setToast] = useState(null);

    // Holds the timeout so we can reset it when another notification arrives
    const toastTimerRef = useRef(null);

    async function fetchGroups() {
        try {
            const response = await axios.get(FETCH_GROUPS);
            setGroups(response.data.groups ?? []);
        } catch (err) {
            console.log(err);
        }
    }

    async function fetchAllGroups() {
        try {
            const response = await axios.get(FETCH_ALL_GROUPS);
            const data = response.data;

            setAllGroups(
                Array.isArray(data)
                    ? data
                    : Object.values(data).find(Array.isArray) ?? []
            );
        } catch (err) {
            setMessage({
                type: "error",
                text: "Could not load the groups"
            });
        }
    }

    async function fetchExistingUsers() {
        try {
            const response = await axios.get(FETCH_EXISTING_USERS);
            setExistingUsers(response.data.userList ?? []);
        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Could not load the users"
            });
        }
    }

    async function createGroup(e) {
        e.preventDefault();

        try {
            await axios.post(CREATE_GROUP, {
                groupName: groupName.trim()
            });

            setGroupName("");
            setMessage({
                type: "success",
                text: "Group created"
            });

            fetchGroups();
        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Could not create the group"
            });
        }
    }

    async function joinGroup(group) {
        try {
            await axios.post(JOIN_GROUP, {
                groupId: group.groupId
            });

            setGroups([...groups, group]);

            setMessage({
                type: "success",
                text: `You joined ${group.groupName}`
            });
        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Could not join the group"
            });
        }
    }

    // Opens a personal chat
    function openPersonalChat(user) {
        setOpenGroup({
            groupId: user.id,
            groupName: user.username,
            isPersonal: true,
        });
    }

    // Fetch the user's groups
    useEffect(() => {
        fetchGroups();
    }, []);

    // Socket.IO connection and notification listener
    useEffect(() => {
        const UserId = Number(sessionStorage.getItem("UserId"));

        if (!Number.isFinite(UserId) || UserId <= 0) {
            console.error("Invalid UserId in sessionStorage");
            return;
        }

        const socket = io(SOCKET_URL, {
            withCredentials: true
        });

        socket.on("connect", () => {
            console.log("Connected to Socket.IO:", socket.id);

            // Join this user's notification room
            socket.emit("joinGroup", {
                notification: true
            });
        });

        socket.on("connect_error", (err) => {
            console.log("Socket connection error:", err.message);
        });

        // Listen for incoming notifications
        socket.on("receiveNotification", (notification) => {
            console.log("Notification received:", notification);

            const userName = notification?.userName;

            if (!userName) return;

            // Display the toast
            if (notification.group) {
                setToast(
                    `You have a message from ${userName} in ${notification.group}`
                );
            } else {
                setToast(`You have a message from ${userName}`);
            }

            // Reset the previous timer if another notification arrives
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }

            // Automatically hide the toast after 4 seconds
            toastTimerRef.current = setTimeout(() => {
                setToast(null);
                toastTimerRef.current = null;
            }, 4000);
        });

        socket.on("messageError", (err) => {
            console.log("Message error:", err.message);
        });

        // Cleanup when Home unmounts
        return () => {
            socket.off("connect");
            socket.off("connect_error");
            socket.off("receiveNotification");
            socket.off("messageError");

            socket.disconnect();

            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
                toastTimerRef.current = null;
            }
        };
    }, []);

    // Debounced user search
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
                const response = await axios.post(FETCH_USERS, {
                    email: q
                });

                if (cancelled) return;

                setUsers(response.data.users ?? []);
                setSearched(true);
            } catch (err) {
                if (cancelled) return;

                setUsers([]);

                setMessage({
                    type: "error",
                    text: err.response?.data?.message || "Could not search for users"
                });
            }
        }, SEARCH_DELAY);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [email, tab]);

    const list =
        tab === "joined"
            ? groups
            : allGroups.filter(
                (g) => !groups.some((j) => j.groupId === g.groupId)
            );

    const showExisting = !email.trim();
    const shownUsers = showExisting ? existingUsers : users;

    return (
        <>
            {/* Notification Toast */}
            {toast && (
                <div
                    className="notification-toast"
                    role="status"
                    aria-live="polite"
                >
                    <span className="toast-icon" aria-hidden="true">
                        ✓
                    </span>

                    <span className="toast-message">
                        {toast}
                    </span>
                </div>
            )}

            {openGroup ? (
                <ChatWindow
                    group={openGroup}
                    onBack={() => setOpenGroup(null)}
                />
            ) : (
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
                            <p
                                className={`groups-message ${message.type}`}
                                role="status"
                            >
                                {message.text}
                            </p>
                        )}

                        <div className="groups-body" role="tabpanel">

                            {tab === "create" ? (
                                <form
                                    className="groups-form"
                                    onSubmit={createGroup}
                                >
                                    <label htmlFor="groupName">
                                        Group name
                                    </label>

                                    <input
                                        id="groupName"
                                        type="text"
                                        placeholder="Enter a group name"
                                        value={groupName}
                                        onChange={(e) =>
                                            setGroupName(e.target.value)
                                        }
                                        required
                                    />

                                    <button
                                        type="submit"
                                        disabled={!groupName.trim()}
                                    >
                                        Create Group
                                    </button>
                                </form>

                            ) : tab === "message" ? (
                                <>
                                    <div className="groups-form">
                                        <label htmlFor="userEmail">
                                            Email ID
                                        </label>

                                        <input
                                            id="userEmail"
                                            type="text"
                                            placeholder="Search by email"
                                            autoComplete="off"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                        />
                                    </div>

                                    {shownUsers.length > 0 ? (
                                        <ul className="groups-list">
                                            {shownUsers.map((u) => (
                                                <li key={u.id}>
                                                    <button
                                                        type="button"
                                                        className="groups-item"
                                                        style={{
                                                            "--hue": (
                                                                u.username.charCodeAt(0) * 37
                                                            ) % 360
                                                        }}
                                                        onClick={() =>
                                                            openPersonalChat(u)
                                                        }
                                                    >
                                                        <div
                                                            className="groups-avatar"
                                                            aria-hidden="true"
                                                        >
                                                            {u.username
                                                                .slice(0, 2)
                                                                .toUpperCase()}
                                                        </div>

                                                        <span className="groups-name">
                                                            {u.username}
                                                        </span>
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
                                                style={{
                                                    "--hue": (
                                                        g.groupName.charCodeAt(0) * 37
                                                    ) % 360
                                                }}
                                                onClick={() =>
                                                    tab === "join"
                                                        ? setSelectedGroup(g)
                                                        : setOpenGroup(g)
                                                }
                                            >
                                                <div
                                                    className="groups-avatar"
                                                    aria-hidden="true"
                                                >
                                                    {g.groupName
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </div>

                                                <span className="groups-name">
                                                    {g.groupName}
                                                </span>

                                                {tab === "join" && (
                                                    <span className="groups-join-label">
                                                        Join
                                                    </span>
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
                            onClick={(e) =>
                                e.target === e.currentTarget &&
                                setSelectedGroup(null)
                            }
                        >
                            <div
                                className="groups-modal"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="join-title"
                            >
                                <h2 id="join-title">
                                    Join {selectedGroup.groupName}?
                                </h2>

                                <p>
                                    You will be able to chat with everyone in this group.
                                </p>

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
            )}
        </>
    );
}

export default Home;
