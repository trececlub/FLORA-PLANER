import Link from "next/link";
import { sendChatMessageAction } from "@/app/(planner)/actions";
import { ChatAutoRefresh } from "@/components/chat-auto-refresh";
import { PlannerPage, SaveMessage } from "@/components/planner-page";
import { Badge, EmptyState, SectionCard } from "@/components/ui";
import { requireSessionUser } from "@/lib/auth";
import { getPlannerSnapshot, markChatThreadAsRead } from "@/lib/data-store";
import { dateFormat, roleLabel, toneForRole } from "@/lib/planner-view";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function strParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function dateTimeFormat(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toTimestamp(value?: string) {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = new Date(value).getTime();
  if (!Number.isFinite(parsed)) return Number.NEGATIVE_INFINITY;
  return parsed;
}

const ACTIVE_PRESENCE_WINDOW_MS = 90 * 1000;

export default async function ChatPage({ searchParams }: PageProps) {
  const currentUser = await requireSessionUser();
  const params = await searchParams;
  const saved = strParam(params.saved);
  const error = strParam(params.error);
  const selectedChatParam = strParam(params.chat);
  const hasSelectedChat = Boolean(selectedChatParam);
  const snapshot = await getPlannerSnapshot();
  const latestMessageByThread = new Map<string, (typeof snapshot.chatMessages)[number]>();

  for (const message of snapshot.chatMessages) {
    const previous = latestMessageByThread.get(message.threadId);
    if (!previous || toTimestamp(message.createdAt) > toTimestamp(previous.createdAt)) {
      latestMessageByThread.set(message.threadId, message);
    }
  }

  const readAtByThread = new Map<string, string>();
  for (const state of snapshot.chatReadStates) {
    if (state.userId !== currentUser.id) continue;
    readAtByThread.set(state.threadId, state.lastReadAt);
  }

  const groupThread =
    snapshot.chatThreads.find((thread) => thread.id === "thread_group_flora") ||
    snapshot.chatThreads.find((thread) => thread.kind === "Group");

  const others = snapshot.users
    .filter((user) => user.id !== currentUser.id)
    .map((user) => {
      const thread = snapshot.chatThreads.find(
        (item) =>
          item.kind === "Direct" &&
          item.memberIds.includes(currentUser.id) &&
          item.memberIds.includes(user.id),
      );

      const lastMessage = thread
        ? latestMessageByThread.get(thread.id)
        : undefined;

      return { user, thread, lastMessage };
    })
    .sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  const chatParam = selectedChatParam || "group";
  const selectedDirectUserId = chatParam.startsWith("direct:") ? chatParam.slice("direct:".length) : "";
  const selectedThread =
    chatParam !== "group"
      ? snapshot.chatThreads.find((thread) => thread.id === chatParam)
      : undefined;

  const directTarget =
    others.find((entry) => entry.user.id === selectedDirectUserId)?.user ||
    (selectedThread?.kind === "Direct"
      ? snapshot.users.find(
          (user) => user.id !== currentUser.id && selectedThread.memberIds.includes(user.id),
        )
      : undefined);

  const activeMode: "group" | "direct" =
    directTarget || selectedThread?.kind === "Direct" ? "direct" : "group";

  const activeThread =
    activeMode === "group"
      ? groupThread
      : others.find((entry) => entry.user.id === directTarget?.id)?.thread;

  const activeMessages = activeThread
    ? snapshot.chatMessages
        .filter((message) => message.threadId === activeThread.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  const activeLastMessage = activeThread ? latestMessageByThread.get(activeThread.id) : undefined;
  if (hasSelectedChat && activeThread && activeLastMessage) {
    await markChatThreadAsRead({
      userId: currentUser.id,
      threadId: activeThread.id,
      lastMessageAt: activeLastMessage.createdAt,
    });
    readAtByThread.set(activeThread.id, activeLastMessage.createdAt);
  }

  const activeChatKey =
    activeMode === "group"
      ? "group"
      : directTarget
        ? `direct:${directTarget.id}`
        : "group";

  const presenceByUser = snapshot.userPresenceMap as Record<string, string> | undefined;
  const nowMs = Number(snapshot.nowMs || 0);

  function isUserActive(userId?: string) {
    if (!userId) return false;
    const lastSeenAt = presenceByUser?.[userId];
    const lastSeenMs = toTimestamp(lastSeenAt);
    return Number.isFinite(lastSeenMs) && nowMs - lastSeenMs <= ACTIVE_PRESENCE_WINDOW_MS;
  }

  function isThreadUnread(threadId?: string) {
    if (!threadId) return false;
    const lastMessage = latestMessageByThread.get(threadId);
    if (!lastMessage) return false;
    if (lastMessage.senderId === currentUser.id) return false;

    const readAt = readAtByThread.get(threadId);
    return toTimestamp(lastMessage.createdAt) > toTimestamp(readAt);
  }

  function presenceDot(active: boolean, label: string) {
    return (
      <span
        className={`chat-presence-dot ${active ? "is-active" : "is-inactive"}`}
        title={label}
        aria-label={label}
      />
    );
  }

  const channelRoleBadge =
    activeMode === "direct" && directTarget ? (
      <div className="chat-channel-role">
        {presenceDot(
          isUserActive(directTarget.id),
          isUserActive(directTarget.id) ? "Usuario activo" : "Usuario inactivo",
        )}
        <Badge tone={toneForRole(directTarget.role)}>{roleLabel[directTarget.role]}</Badge>
      </div>
    ) : null;

  const channelAction =
    hasSelectedChat || channelRoleBadge ? (
      <div className="chat-channel-actions">
        {hasSelectedChat ? (
          <Link href="/chat" className="btn btn-ghost chat-mobile-back">
            Conversaciones
          </Link>
        ) : null}
        {channelRoleBadge}
      </div>
    ) : undefined;

  return (
    <PlannerPage
      title="Chat"
      description="Comunicacion interna del equipo en chat grupal y directo."
      className="planner-page-chat"
    >
      <ChatAutoRefresh />
      <SaveMessage saved={saved} error={error} />

      <section
        className={`chat-shell chat-shell-desktop ${hasSelectedChat ? "chat-mobile-channel" : "chat-mobile-list"}`}
      >
        <SectionCard
          title="Conversaciones"
          subtitle="Selecciona chat grupal o directo."
          className="chat-conversations-card"
        >
          <div className="chat-thread-list">
            <Link
              href="/chat?chat=group"
              className={`chat-thread-item ${hasSelectedChat && activeMode === "group" ? "is-active" : ""}`}
            >
              <div>
                <p className="list-title">Chat grupal FLORA</p>
                <p className="list-subtitle">Todos los miembros activos</p>
              </div>
              <div className="chat-thread-meta">
                {isThreadUnread(groupThread?.id) ? <span className="chat-unread-dot" aria-label="Mensajes sin leer" /> : null}
                <Badge tone="accent">Grupo</Badge>
              </div>
            </Link>

            {others.length === 0 ? (
              <EmptyState title="Sin usuarios" detail="Crea usuarios para habilitar chat directo." />
            ) : (
              others.map((entry) => (
                <Link
                  key={entry.user.id}
                  href={`/chat?chat=${encodeURIComponent(`direct:${entry.user.id}`)}`}
                  className={`chat-thread-item ${hasSelectedChat && activeMode === "direct" && directTarget?.id === entry.user.id ? "is-active" : ""}`}
                >
                  <div>
                    <p className="list-title">{entry.user.name}</p>
                    <p className="list-subtitle">
                      {entry.lastMessage ? `${dateTimeFormat(entry.lastMessage.createdAt)} · ${entry.lastMessage.text}` : "Sin mensajes"}
                    </p>
                  </div>
                  <div className="chat-thread-meta">
                    {presenceDot(
                      isUserActive(entry.user.id),
                      isUserActive(entry.user.id) ? "Usuario activo" : "Usuario inactivo",
                    )}
                    {isThreadUnread(entry.thread?.id) ? <span className="chat-unread-dot" aria-label="Mensajes sin leer" /> : null}
                    <Badge tone={toneForRole(entry.user.role)}>{roleLabel[entry.user.role]}</Badge>
                  </div>
                </Link>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={activeMode === "group" ? "Canal grupal" : `Chat con ${directTarget?.name || "usuario"}`}
          subtitle={
            activeMode === "group"
              ? "Coordina temas generales del equipo."
              : `${directTarget?.jobTitle || "Miembro"} · ${directTarget?.email || ""}`
          }
          className="chat-channel-card"
          action={channelAction}
        >
          <div className="chat-message-list">
            {activeMessages.length === 0 ? (
              <EmptyState
                title="Sin mensajes"
                detail={activeMode === "group" ? "Envia el primer mensaje al equipo." : "Inicia esta conversacion directa."}
              />
            ) : (
              activeMessages.map((message) => {
                const sender = snapshot.userMap[message.senderId];
                const mine = message.senderId === currentUser.id;
                return (
                  <article key={message.id} className={`chat-bubble ${mine ? "mine" : ""}`}>
                    <p className="chat-author">{mine ? "Tu" : sender?.name || "Usuario"}</p>
                    <p className="chat-text">{message.text}</p>
                    <p className="chat-time">{dateTimeFormat(message.createdAt)}</p>
                  </article>
                );
              })
            )}
          </div>

          <form action={sendChatMessageAction} className="chat-compose">
            <input type="hidden" name="returnTo" value="/chat" />
            <input type="hidden" name="chatKey" value={activeChatKey} />
            {activeMode === "group" ? (
              <input type="hidden" name="mode" value="group" />
            ) : (
              <>
                <input type="hidden" name="mode" value="direct" />
                <input type="hidden" name="targetUserId" value={directTarget?.id || ""} />
              </>
            )}
            <label htmlFor="chat-message-textarea">Mensaje</label>
            <div className="chat-compose-field">
              <textarea
                id="chat-message-textarea"
                name="text"
                rows={3}
                placeholder="Escribe tu mensaje interno..."
                className="chat-compose-textarea"
              />
              <button className="chat-send-button" type="submit" aria-label="Enviar mensaje">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M21 3L10 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 3L14 21L10 14L3 10L21 3Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </form>
          {activeMode === "direct" && directTarget ? (
            <p className="list-subtitle">Canal directo con {directTarget.name}. Creado para conversaciones 1 a 1.</p>
          ) : (
            <p className="list-subtitle">Canal grupal para coordinacion operativa diaria.</p>
          )}
          <p className="list-subtitle">Fecha de hoy: {dateFormat(new Date().toISOString())}</p>
        </SectionCard>
      </section>
    </PlannerPage>
  );
}
