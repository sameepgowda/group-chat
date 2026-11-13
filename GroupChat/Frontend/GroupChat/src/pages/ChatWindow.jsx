import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "../styles/Home.css";

// TODO: replace with the logged-in user (from your login response)
const CURRENT_USER = { id: 1, name: "You" };

const GROUP = { name: "Project Team", members: 5, online: 3 };

const NEAR_BOTTOM_PX = 120; // closer than this to the bottom counts as "at the bottom"
const GROUP_GAP_MS = 5 * 60 * 1000; // same sender within 5 minutes = one visual group
const MAX_INPUT_HEIGHT = 120;

/* ---------- Sample data (DEMO ONLY: replace with your API / socket data) ---------- */

const daysAgoAt = (days, hours, minutes) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

const minutesAgo = (m) => new Date(Date.now() - m * 60 * 1000).toISOString();

const TEAMMATES = [
  { id: 2, name: "Priya" },
  { id: 3, name: "Arjun" },
  { id: 4, name: "Meera" },
  { id: 5, name: "Rohan" },
];

const DEMO_REPLIES = [
  "Sounds good to me!",
  "Can you share the link again?",
  "Nice, I'll take a look after lunch.",
  "Haha, exactly what I was thinking.",
];

const INITIAL_MESSAGES = [
  { id: 1, senderId: 2, senderName: "Priya", text: "Great work on the release, team!", createdAt: daysAgoAt(1, 18, 2) },
  { id: 2, senderId: 3, senderName: "Arjun", text: "Thanks! Deployed it on EC2 after lunch.", createdAt: daysAgoAt(1, 18, 3) },
  { id: 3, senderId: 3, senderName: "Arjun", text: "NGINX and PM2 are both set up.", createdAt: daysAgoAt(1, 18, 4) },
  { id: 4, senderId: 1, senderName: "You", text: "Nice, HTTPS is live too.", createdAt: daysAgoAt(1, 18, 10) },
  { id: 5, senderId: 4, senderName: "Meera", text: "Morning everyone! Standup in 10 minutes.", createdAt: minutesAgo(95) },
  { id: 6, senderId: 5, senderName: "Rohan", text: "On my way.", createdAt: minutesAgo(93) },
  { id: 7, senderId: 1, senderName: "You", text: "Joining now.", createdAt: minutesAgo(91) },
  { id: 8, senderId: 4, senderName: "Meera", text: "Quick reminder: the demo is scheduled for Friday, so please have your parts of the project ready, tested and deployed by Thursday evening.", createdAt: minutesAgo(60) },
  { id: 9, senderId: 1, senderName: "You", text: "Mine is already live.", createdAt: minutesAgo(58) },
  { id: 10, senderId: 2, senderName: "Priya", text: "Same here.", createdAt: minutesAgo(41) },
  { id: 11, senderId: 2, senderName: "Priya", text: "Anyone free to review my pull request?", createdAt: minutesAgo(40) },
  { id: 12, senderId: 3, senderName: "Arjun", text: "I can do it in 10 minutes.", createdAt: minutesAgo(12) },
];

/* ---------- Helpers ---------- */

const startOfDay = (value) => {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

const isSameDay = (a, b) => startOfDay(a) === startOfDay(b);

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const formatDay = (iso) => {
  const diffDays = Math.round(
    (startOfDay(Date.now()) - startOfDay(iso)) / 86400000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Gives each sender a stable colour (0 to 359) based on their id
const hueFor = (key) => {
  let hash = 0;
  for (const ch of String(key)) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return hash;
};

const initials = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ---------- One message row ---------- */

function MessageRow({ msg, isOwn, isFirst, isLast }) {
  const classes = [
    "chat-msg",
    isOwn ? "own" : "other",
    isFirst ? "first" : "",
    isLast ? "last" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} style={{ "--hue": hueFor(msg.senderId) }}>
      {!isOwn &&
        (isLast ? (
          <div className="chat-avatar" aria-hidden="true">
            {initials(msg.senderName)}
          </div>
        ) : (
          <div className="chat-avatar-spacer" aria-hidden="true" />
        ))}

      <div className="chat-bubble">
        {!isOwn && isFirst && (
          <span className="chat-sender">{msg.senderName}</span>
        )}
        <span className="chat-text">{msg.text}</span>
        <time className="chat-time" dateTime={msg.createdAt}>
          {formatTime(msg.createdAt)}
        </time>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

function ChatWindow() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [unread, setUnread] = useState(0);
  const [showJump, setShowJump] = useState(false);
  const [typingUser, setTypingUser] = useState(null); // DEMO ONLY

  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const stickToBottom = useRef(true); // true while the person is reading the latest messages
  const firstRun = useRef(true);
  const demoTimers = useRef([]);

  /* ----- Scrolling ----- */

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const el = listRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : behavior });
  }, []);

  // Track whether the person is near the bottom while they scroll
  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;

    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distance < NEAR_BOTTOM_PX;

    stickToBottom.current = nearBottom;
    setShowJump(!nearBottom);
    if (nearBottom) setUnread(0);
  };

  // New message: jump on first load, follow your own messages, follow others only
  // if you're already at the bottom, otherwise count it as unread
  useLayoutEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      scrollToBottom("auto");
      return;
    }

    const last = messages[messages.length - 1];
    if (!last) return;

    if (last.senderId === CURRENT_USER.id || stickToBottom.current) {
      scrollToBottom("smooth");
    } else {
      setUnread((count) => count + 1);
    }
  }, [messages, scrollToBottom]);

  // Keep the typing indicator in view if you're at the bottom
  useEffect(() => {
    if (typingUser && stickToBottom.current) scrollToBottom("smooth");
  }, [typingUser, scrollToBottom]);

  const jumpToLatest = () => {
    scrollToBottom("smooth");
    setUnread(0);
  };

  /* ----- Message box ----- */

  // Grow the textarea with its content, up to a limit
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [draft]);

  // DEMO ONLY: pretend a teammate replies. Delete this once sockets are connected.
  const simulateReply = () => {
    const teammate = TEAMMATES[Math.floor(Math.random() * TEAMMATES.length)];
    const reply = DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];

    const startTyping = setTimeout(() => setTypingUser(teammate), 700);
    const deliver = setTimeout(() => {
      setTypingUser(null);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          senderId: teammate.id,
          senderName: teammate.name,
          text: reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    }, 2400);

    demoTimers.current.push(startTyping, deliver);
  };

  useEffect(() => {
    return () => demoTimers.current.forEach(clearTimeout);
  }, []);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    const message = {
      id: Date.now(),
      senderId: CURRENT_USER.id,
      senderName: CURRENT_USER.name,
      text,
      createdAt: new Date().toISOString(),
    };

    // TODO: send it to the server here, for example socket.emit("message", message)
    setMessages((prev) => [...prev, message]);
    setDraft("");
    textareaRef.current?.focus();

    simulateReply(); // DEMO ONLY
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  // Enter sends, Shift+Enter adds a new line
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ----- Build the list: day separators plus grouped messages ----- */

  const items = useMemo(() => {
    const result = [];

    messages.forEach((msg, i) => {
      const prev = messages[i - 1];
      const next = messages[i + 1];

      const newDay = !prev || !isSameDay(prev.createdAt, msg.createdAt);
      if (newDay) {
        result.push({
          type: "day",
          id: `day-${msg.id}`,
          label: formatDay(msg.createdAt),
        });
      }

      const continuesPrev =
        prev &&
        !newDay &&
        prev.senderId === msg.senderId &&
        new Date(msg.createdAt) - new Date(prev.createdAt) < GROUP_GAP_MS;

      const continuesNext =
        next &&
        isSameDay(msg.createdAt, next.createdAt) &&
        next.senderId === msg.senderId &&
        new Date(next.createdAt) - new Date(msg.createdAt) < GROUP_GAP_MS;

      result.push({
        type: "message",
        msg,
        isOwn: msg.senderId === CURRENT_USER.id,
        isFirst: !continuesPrev,
        isLast: !continuesNext,
      });
    });

    return result;
  }, [messages]);

  /* ----- Render ----- */

  return (
    <div className="chat-page">
      <section className="chat-window" aria-label={`${GROUP.name} chat`}>
        <header className="chat-header">
          <div className="chat-group-avatar" aria-hidden="true">
            {initials(GROUP.name)}
          </div>

          <div className="chat-header-text">
            <h1>{GROUP.name}</h1>
            <p className="chat-status">
              {typingUser
                ? `${typingUser.name} is typing…`
                : `${GROUP.members} members · ${GROUP.online} online`}
            </p>
          </div>
        </header>

        <div className="chat-messages-wrap">
          <div
            className="chat-messages"
            ref={listRef}
            onScroll={handleScroll}
            role="log"
            aria-live="polite"
            aria-label="Messages"
          >
            {items.map((item) =>
              item.type === "day" ? (
                <div key={item.id} className="chat-day">
                  <span>{item.label}</span>
                </div>
              ) : (
                <MessageRow
                  key={item.msg.id}
                  msg={item.msg}
                  isOwn={item.isOwn}
                  isFirst={item.isFirst}
                  isLast={item.isLast}
                />
              )
            )}

            {typingUser && (
              <div
                className="chat-msg other first last chat-typing"
                style={{ "--hue": hueFor(typingUser.id) }}
                aria-hidden="true"
              >
                <div className="chat-avatar">{initials(typingUser.name)}</div>
                <div className="chat-bubble">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}
          </div>

          {showJump && (
            <button
              type="button"
              className="chat-jump"
              onClick={jumpToLatest}
              aria-label={
                unread > 0
                  ? `Jump to latest, ${unread} new messages`
                  : "Jump to latest messages"
              }
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {unread > 0 && <span className="chat-jump-badge">{unread}</span>}
            </button>
          )}
        </div>

        <form className="chat-composer" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className="chat-input"
            rows={1}
            placeholder="Type a message"
            aria-label="Message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            type="submit"
            className="chat-send"
            disabled={!draft.trim()}
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </section>
    </div>
  );
}

export default ChatWindow;
