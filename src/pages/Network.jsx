import { createElement, useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  FaUsers,
  FaUserPlus,
  FaUserCheck,
  FaClock,
  FaPaperPlane,
  FaMapMarkerAlt,
  FaComments,
  FaArrowRight,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { request, jsonRequest } from "../lib/api";
import {
  Avatar,
  PageHeading,
  SearchField,
  EmptyState,
  CardsLoading,
  ErrorBanner,
  Dialog,
} from "../components/community/CommunityUI";

const tabs = [
  ["all", "Discover", FaUsers],
  ["connections", "Connections", FaUserCheck],
  ["pending", "Invitations", FaClock],
  ["sent", "Sent", FaPaperPlane],
  ["suggestions", "For you", FaUserPlus],
];
export default function Network() {
  const { user, userProfile } = useAuth();
  const [people, setPeople] = useState([]);
  const [relations, setRelations] = useState([]);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [profession, setProfession] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [visible, setVisible] = useState(18);
  useEffect(() => {
    if (!user?.uid) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      request("/api/users", { signal: controller.signal }),
      request(`/api/connections/user/${user.uid}`, {
        signal: controller.signal,
      }),
    ])
      .then(([users, connections]) => {
        if (!users.success || !connections.success)
          throw new Error("Your network could not be loaded.");
        if (!controller.signal.aborted) {
          setPeople(users.users.filter((p) => p.uid && p.uid !== user.uid));
          setRelations(connections.connections);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user?.uid, refresh]);
  const members = useMemo(() => {
    const byUid = new Map(
      relations.map((r) => [
        r.senderId === user?.uid ? r.receiverId : r.senderId,
        r,
      ]),
    );
    return people.map((p) => {
      const r = byUid.get(p.uid);
      return {
        ...p,
        connectionStatus: r?.status || null,
        connectionId: r?._id,
        isSender: r?.senderId === user?.uid,
        invitation: r?.message || "",
      };
    });
  }, [people, relations, user?.uid]);
  const counts = {
    connections: members.filter((p) => p.connectionStatus === "accepted")
      .length,
    pending: members.filter(
      (p) => p.connectionStatus === "pending" && !p.isSender,
    ).length,
    sent: members.filter((p) => p.connectionStatus === "pending" && p.isSender)
      .length,
  };
  const professions = [
    ...new Set(people.map((p) => p.profession).filter(Boolean)),
  ].sort();
  const filtered = useMemo(
    () =>
      members
        .filter((p) => {
          if (tab === "connections" && p.connectionStatus !== "accepted")
            return false;
          if (
            tab === "pending" &&
            !(p.connectionStatus === "pending" && !p.isSender)
          )
            return false;
          if (
            tab === "sent" &&
            !(p.connectionStatus === "pending" && p.isSender)
          )
            return false;
          if (tab === "suggestions" && p.connectionStatus) return false;
          return (
            (!profession || p.profession === profession) &&
            [
              p.displayName,
              p.profession,
              p.location,
              ...(Array.isArray(p.skills)
                ? p.skills.map((s) =>
                    typeof s === "string" ? s : s.name || "",
                  )
                : []),
            ]
              .join(" ")
              .toLowerCase()
              .includes(search.trim().toLowerCase())
          );
        })
        .sort((a, b) => {
          if (tab !== "suggestions") return 0;
          const score = (p) =>
            Number(!!p.profession && p.profession === userProfile?.profession) *
              2 +
            Number(!!p.location && p.location === userProfile?.location);
          return score(b) - score(a);
        }),
    [
      members,
      tab,
      profession,
      search,
      userProfile?.profession,
      userProfile?.location,
    ],
  );
  const activePerson = members.find((p) => p.uid === selected) || null;
  const act = async (action, person) => {
    if (busy) return;
    setBusy(true);
    try {
      const paths = {
        accept: "accept-request",
        reject: "reject-request",
        withdraw: "withdraw-request",
        remove: "remove-connection",
      };
      const data =
        action === "connect"
          ? await request(
              "/api/connections/send-request",
              jsonRequest("POST", {
                senderId: user.uid,
                receiverId: person.uid,
                message: "Hi, I'd like to connect with you on Career AI.",
              }),
            )
          : await request(
              `/api/connections/${paths[action]}/${person.connectionId}`,
              {
                method: ["withdraw", "remove"].includes(action)
                  ? "DELETE"
                  : "POST",
              },
            );
      if (!data.success)
        throw new Error(data.message || "This action could not be completed.");
      toast.success(
        {
          connect: "Invitation sent",
          accept: "You are now connected",
          reject: "Invitation declined",
          withdraw: "Invitation withdrawn",
          remove: "Connection removed",
        }[action],
      );
      setConfirm(null);
      setRefresh((v) => v + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  const actions = (person) => {
    if (person.connectionStatus === "accepted")
      return (
        <>
          <Link
            to={`/messages?user=${encodeURIComponent(person.uid)}`}
            className="cc-primary flex-1"
          >
            <FaComments />
            Message
          </Link>
          <button
            disabled={busy}
            onClick={() => {
              setSelected(null);
              setConfirm(person);
            }}
            className="cc-secondary"
          >
            Remove
          </button>
        </>
      );
    if (person.connectionStatus === "pending")
      return person.isSender ? (
        <button
          disabled={busy}
          onClick={() => act("withdraw", person)}
          className="cc-secondary flex-1"
        >
          Withdraw invitation
        </button>
      ) : (
        <>
          <button
            disabled={busy}
            onClick={() => act("accept", person)}
            className="cc-primary flex-1"
          >
            Accept
          </button>
          <button
            disabled={busy}
            onClick={() => act("reject", person)}
            className="cc-secondary"
          >
            Decline
          </button>
        </>
      );
    if (person.connectionStatus === "rejected")
      return (
        <span className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
          Invitation declined
        </span>
      );
    return (
      <button
        disabled={busy}
        onClick={() => act("connect", person)}
        className="cc-primary flex-1"
      >
        <FaUserPlus />
        Connect
      </button>
    );
  };
  const changeTab = (next) => {
    setTab(next);
    setVisible(18);
  };
  return (
    <div className="cc-container py-7 sm:py-10">
      <PageHeading
        eyebrow="People & possibilities"
        title="Good connections go a long way."
        description="Meet peers and recruiters, share your experience and build your professional circle."
      >
        <Link to="/messages" className="cc-secondary">
          <FaComments />
          Messages <FaArrowRight />
        </Link>
      </PageHeading>
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          ["connections", "Connections", FaUserCheck],
          ["pending", "Invitations", FaClock],
          ["sent", "Sent requests", FaPaperPlane],
        ].map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => changeTab(id)}
            className="cc-panel flex flex-wrap items-center gap-3 p-3 text-left hover:border-blue-200 sm:p-5"
          >
            <span className="hidden rounded-xl bg-blue-50 p-3 text-blue-600 sm:block">
              {createElement(Icon)}
            </span>
            <div>
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                {loading ? "—" : counts[id]}
              </p>
              <p className="mt-1 text-xs text-gray-500">{label}</p>
            </div>
          </button>
        ))}
      </div>
      <section
        className="cc-panel mb-6 overflow-hidden"
        aria-label="Network controls"
      >
        <nav
          aria-label="Network sections"
          className="flex overflow-x-auto border-b border-gray-100 p-2"
        >
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => changeTab(id)}
              aria-pressed={tab === id}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${tab === id ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {createElement(Icon)}
              {label}
              {counts[id] > 0 && (
                <span className="rounded-md bg-white px-2 py-0.5 text-xs">
                  {counts[id]}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <SearchField
            label="Search people"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisible(18);
            }}
            placeholder="Search by name, skill or location"
          />
          <select
            aria-label="Filter by profession"
            value={profession}
            onChange={(e) => {
              setProfession(e.target.value);
              setVisible(18);
            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 sm:max-w-64"
          >
            <option value="">All professions</option>
            {professions.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </section>
      <ErrorBanner error={error} onRetry={() => setRefresh((v) => v + 1)} />
      <div className="mb-4 flex flex-wrap justify-between gap-2">
        <h2 className="text-base font-bold text-gray-800">
          {tabs.find((t) => t[0] === tab)?.[1]}
        </h2>
        <p aria-live="polite" className="text-xs text-gray-500">
          {loading ? "Loading your network…" : `${filtered.length} people`}
        </p>
      </div>
      {loading ? (
        <CardsLoading />
      ) : error ? null : !filtered.length ? (
        <EmptyState
          icon={FaUsers}
          title={
            tab === "pending" ? "You are all caught up" : "No people to show"
          }
          description={
            search || profession
              ? "Try a different search or clear your filters."
              : "Explore the community and connect with people who share your interests."
          }
        >
          <button
            className="cc-primary"
            onClick={() => {
              setSearch("");
              setProfession("");
              changeTab("all");
            }}
          >
            Explore people
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.slice(0, visible).map((person) => (
              <article
                key={person.uid}
                className="cc-panel cc-enter flex min-w-0 flex-col overflow-hidden"
              >
                <div className="h-16 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50" />
                <div className="flex flex-1 flex-col px-5 pb-5">
                  <div className="-mt-7 mb-3 flex items-end justify-between gap-2">
                    <Avatar
                      person={person}
                      className="h-16 w-16 ring-4 ring-white"
                    />
                    {person.connectionStatus === "accepted" && (
                      <span className="mb-1 flex items-center gap-1 text-xs font-medium text-blue-600">
                        <FaUserCheck />
                        Connected
                      </span>
                    )}
                    {person.connectionStatus === "pending" && (
                      <span className="mb-1 text-xs text-gray-400">
                        {person.isSender
                          ? "Invitation sent"
                          : "Wants to connect"}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelected(person.uid)}
                    className="text-left text-lg font-bold text-gray-900 hover:text-blue-600"
                  >
                    {person.displayName || "Member"}
                  </button>
                  <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                    {person.profession ||
                      (person.userType === "recruiter"
                        ? "Recruiter"
                        : "Career community member")}
                  </p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                    <FaMapMarkerAlt />
                    {person.location || "Location not added"}
                  </p>
                  <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-gray-500">
                    {tab === "pending"
                      ? person.invitation
                      : person.bio ||
                        "Get to know this member and grow your network."}
                  </p>
                  <div className="mb-4 mt-3 flex flex-wrap gap-1.5">
                    {(Array.isArray(person.skills) ? person.skills : [])
                      .slice(0, 3)
                      .map((s, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-gray-50 px-2 py-1 text-[11px] text-gray-500"
                        >
                          {typeof s === "string" ? s : s.name}
                        </span>
                      ))}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {actions(person)}
                  </div>
                  <button
                    onClick={() => setSelected(person.uid)}
                    className="mt-3 py-1 text-xs font-semibold text-blue-600"
                  >
                    View profile
                  </button>
                </div>
              </article>
            ))}
          </div>
          {filtered.length > visible && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setVisible((v) => v + 18)}
                className="cc-secondary"
              >
                Show more people
              </button>
            </div>
          )}
        </>
      )}
      {activePerson && (
        <Dialog
          title="Member profile"
          onClose={() => setSelected(null)}
          footer={actions(activePerson)}
          busy={busy}
        >
          <div className="flex items-center gap-4">
            <Avatar person={activePerson} className="h-20 w-20" />
            <div>
              <h3 className="text-xl font-bold">
                {activePerson.displayName || "Member"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {activePerson.profession || "Career community member"}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {activePerson.location}
              </p>
            </div>
          </div>
          {activePerson.bio && (
            <section className="mt-6">
              <h3 className="mb-2 text-sm font-bold">About</h3>
              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-600">
                {activePerson.bio}
              </p>
            </section>
          )}
          {Array.isArray(activePerson.skills) &&
            activePerson.skills.length > 0 && (
              <section className="mt-6">
                <h3 className="mb-3 text-sm font-bold">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {activePerson.skills.map((s, i) => (
                    <span
                      key={i}
                      className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700"
                    >
                      {typeof s === "string" ? s : s.name}
                    </span>
                  ))}
                </div>
              </section>
            )}
          {["experience", "education"].map(
            (key) =>
              Array.isArray(activePerson[key]) &&
              activePerson[key].length > 0 && (
                <section key={key} className="mt-6">
                  <h3 className="mb-3 text-sm font-bold capitalize">{key}</h3>
                  {activePerson[key].map((item, i) => (
                    <div
                      key={i}
                      className="mb-2 rounded-xl bg-gray-50 p-4 text-sm"
                    >
                      <p className="font-semibold">
                        {typeof item === "string"
                          ? item
                          : item.title ||
                            item.role ||
                            item.degree ||
                            item.position}
                      </p>
                      {typeof item !== "string" && (
                        <>
                          <p className="mt-1 text-gray-500">
                            {item.company || item.institution || item.school}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-gray-500">
                            {item.description}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </section>
              ),
          )}
        </Dialog>
      )}
      {confirm && (
        <Dialog
          title="Remove connection?"
          onClose={() => setConfirm(null)}
          busy={busy}
          footer={
            <>
              <button
                disabled={busy}
                onClick={() => setConfirm(null)}
                className="cc-secondary"
              >
                Keep connection
              </button>
              <button
                disabled={busy}
                onClick={() => act("remove", confirm)}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? "Removing…" : "Remove connection"}
              </button>
            </>
          }
        >
          <p className="text-sm leading-6 text-gray-600">
            Remove {confirm.displayName || "this member"} from your network?
            Messaging requires an accepted connection.
          </p>
        </Dialog>
      )}
    </div>
  );
}
