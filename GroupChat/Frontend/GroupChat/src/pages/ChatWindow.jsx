import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";

import axios from "axios";
import { io } from "socket.io-client";

import "../styles/ChatWindow.css";

const MAX_INPUT_HEIGHT = 120;

const SOCKET_URL = "http://localhost:3000";

const FETCH_MESSAGES =
  "http://localhost:3000/groupChat/chat/fetchMessages";

// POST { receiverId }. Expected response:
// { UserId, User, messages: [{ id, message, senderId, receiverId, createdAt }] }
const FETCH_PERSONAL_MESSAGES =
  "http://localhost:3000/groupChat/chat/fetchPersonalMessages";

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

// Get the sender's username.
function getSenderName(message) {
  return (
    message["User.username"] ||
    message.senderName ||
    message.User?.username ||
    message.sender?.username ||
    ""
  );
}

// Prevent duplicate messages.
function mergeMessages(existing, incoming) {
  const combined = [...existing, ...incoming];

  const uniqueMessages = new Map();

  combined.forEach((message) => {
    const key =
      message.id ??
      `${message.senderId}-${message.createdAt}-${message.text}`;

    uniqueMessages.set(String(key), message);
  });

  return Array.from(uniqueMessages.values());
}

function ChatWindow({ group, onBack }) {

  // For a personal chat, group.groupId is the receiver's userId
  // and group.groupName is the receiver's username.
  const isPersonal = Boolean(group.isPersonal);

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");

  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const socketRef = useRef(null);

  const currentUserIdRef = useRef(null);
  const currentUserNameRef = useRef("");

  // Establish socket connection and fetch previous messages.
  useEffect(() => {

    let active = true;

    setMessages([]);
    setDraft("");

    currentUserIdRef.current = null;
    currentUserNameRef.current = "";

    const socket = io(SOCKET_URL, {
      withCredentials: true
    });

    socketRef.current = socket;

    // Socket connection established.
    socket.on("connect", () => {

      console.log("Connected to Socket.IO:", socket.id);

      // For a personal chat this is the receiver's userId.
      if(isPersonal){
        socket.emit("joinGroup", {isPersonal:true,groupId:group.groupId})
      }else{socket.emit("joinGroup", {isPersonal:false,groupId:group.groupId})};

    });

    socket.on("connect_error", (err) => {
      console.log("Socket connection error:", err.message);
    });

    // Receive new messages from the backend.
    socket.on("receiveMessage", (message) => {

      // In a personal chat, only show messages between you and this user.
      // if (isPersonal) {
      //   const belongsHere =
      //     String(message.senderId) === String(group.groupId) ||
      //     String(message.receiverId) === String(group.groupId);

      //   if (!belongsHere) return;
      // }

      const normalizedMessage = {
        id: message.id,
        senderId: message.senderId,
        senderName: message.senderName,
        text: message.text,
        createdAt: message.createdAt,
        isOwn:
          String(message.senderId) ===
          String(currentUserIdRef.current)
      };

      setMessages((prevMessages) =>
        mergeMessages(prevMessages, [normalizedMessage])
      );

    });

    socket.on("messageError", (err) => {
      console.log("Message error:", err.message);
    });

    // Fetch previously stored messages.
    async function fetchMessages() {

      try {

        const response = isPersonal
          ? await axios.post(
              FETCH_PERSONAL_MESSAGES,
              { senderId: group.groupId },
              { withCredentials: true }
            )
          : await axios.post(
              FETCH_MESSAGES,
              { groupId: group.groupId },
              { withCredentials: true }
            );

        if (!active) return;

        const {
          UserId,
          User,
          messages: fetched
        } = response.data;

        currentUserIdRef.current = UserId;
        currentUserNameRef.current = User?.username ?? "";

        const normalizedMessages = (fetched ?? []).map((m) => {

          // Group messages store the sender in UserId,
          // personal messages store it in senderId.
          const senderId = isPersonal ? m.senderId : m.UserId;

          const isOwn =
            String(senderId) === String(UserId);

          // In a personal chat the other person is the receiver we opened.
          const fallbackName = isOwn
            ? currentUserNameRef.current
            : isPersonal
            ? group.groupName
            : `User ${senderId}`;

          return {
            id: m.id,
            senderId,

            // IMPORTANT: Backend returns "User.username" for group messages.
            senderName: getSenderName(m) || fallbackName,

            text: m.message,
            createdAt: m.createdAt,
            isOwn
          };

        });

        setMessages((prevMessages) => {

          const updatedMessages = prevMessages.map((m) => {

            const isOwn =
              String(m.senderId) === String(UserId);

            return {
              ...m,
              isOwn,
              senderName:
                isOwn && m.senderName?.startsWith("User ")
                  ? currentUserNameRef.current
                  : m.senderName
            };

          });

          return mergeMessages(
            updatedMessages,
            normalizedMessages
          );

        });

      } catch (err) {
        console.log("Could not fetch messages:", err);
      }

    }

    fetchMessages();

    // Cleanup when switching chats or closing the chat.
    return () => {

      active = false;

      socket.off("connect");
      socket.off("connect_error");
      socket.off("receiveMessage");
      socket.off("messageError");

      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

    };

  }, [group.groupId, isPersonal]);

  // Send a message through Socket.IO.
  function sendMessage(e) {

    e.preventDefault();

    const trimmedText = draft.trim();

    if (!trimmedText) return;

    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      console.log("Socket is not connected");
      return;
    }

    // if (!currentUserIdRef.current) {
    //   console.log("User information is not available");
    //   return;
    // }

    if (isPersonal) {

      // Personal message: text, senderId and receiverId (no groupId).
      socket.emit("sendMessage", {

    receiverId: group.groupId, // receiver's userId, passed from Home.jsx

    senderId: currentUserIdRef.current,

    senderName: currentUserNameRef.current,

    text: trimmedText

  });

    } else {

      socket.emit("sendMessage", {

        groupId: group.groupId,

        senderId: currentUserIdRef.current,

        senderName: currentUserNameRef.current,

        text: trimmedText

      });

    }

    setDraft("");

  }

  // Scroll to the newest message.
  useEffect(() => {

    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth"
    });

  }, [messages]);

  // Automatically grow the textarea.
  useLayoutEffect(() => {

    const el = textareaRef.current;

    if (!el) return;

    el.style.height = "auto";

    el.style.height =
      `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;

  }, [draft]);

  return (

    <div className="chat-page">

      <section
        className="chat-window"
        aria-label={`${group.groupName} chat`}
      >

        <header className="chat-header">

          <button
            type="button"
            className="chat-back"
            onClick={onBack}
            aria-label="Back to groups"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div
            className="chat-group-avatar"
            aria-hidden="true"
          >
            {group.groupName.slice(0, 2).toUpperCase()}
          </div>

          <div className="chat-header-text">
            <h1>{group.groupName}</h1>
          </div>

        </header>

        <div className="chat-messages-wrap">

          <div
            className="chat-messages"
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-label="Messages"
          >

            {messages.map((m, index) => (

              <div
                key={m.id ?? `${m.senderId}-${m.createdAt}-${index}`}
                className={`chat-msg ${
                  m.isOwn ? "own" : "other"
                } first last`}
              >

                <div className="chat-bubble">

                  <span className="chat-sender">
                    {m.senderName}
                  </span>

                  <span className="chat-text">
                    {m.text}
                  </span>

                  {m.createdAt && (

                    <time
                      className="chat-time"
                      dateTime={m.createdAt}
                    >
                      {formatTime(m.createdAt)}
                    </time>

                  )}

                </div>

              </div>

            ))}

          </div>

        </div>

        <form
          className="chat-composer"
          onSubmit={sendMessage}
        >

          <textarea
            ref={textareaRef}
            className="chat-input"
            rows={1}
            placeholder="Type a message"
            aria-label="Message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {

              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {

                e.preventDefault();

                if (draft.trim()) {
                  e.target.form.requestSubmit();
                }

              }

            }}
          />

          <button
            type="submit"
            className="chat-send"
            disabled={!draft.trim()}
            aria-label="Send message"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 12h13M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

        </form>

      </section>

    </div>

  );

}

export default ChatWindow;