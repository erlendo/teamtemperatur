"use client";

import {
    addMemberTag,
    deleteItem,
    toggleItemStatus,
    updateItem,
    type TeamItem,
} from "@/server/actions/dashboard";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PersonChip } from "./PersonChip";
import { SystemTagInput } from "./SystemTagInput";

interface TeamItemCardProps {
  item: TeamItem;
  teamMembers: Array<{ id: string; email: string }>;
  onUpdate?: () => void;
}

type ItemStatus = "planlagt" | "pågår" | "ferdig";

export function TeamItemCard({
  item,
  teamMembers,
  onUpdate,
}: TeamItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const router = useRouter();

  const handleSaveTitle = async () => {
    if (title.trim() && title !== item.title) {
      await updateItem(item.id, { title: title.trim() });
      router.refresh();
      onUpdate?.();
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm("Er du sikker på at du vil slette denne?")) {
      await deleteItem(item.id);
      router.refresh();
      onUpdate?.();
    }
  };

  const handleToggleStatus = async () => {
    await toggleItemStatus(item.id, item.status);
    router.refresh();
    onUpdate?.();
  };

  const handleStatusChange = async (newStatus: ItemStatus) => {
    await updateItem(item.id, { status: newStatus });
    router.refresh();
    onUpdate?.();
  };

  const handleAddMember = async (userId: string) => {
    await addMemberTag(item.id, userId);
    setShowMemberDropdown(false);
    router.refresh();
    onUpdate?.();
  };

  const handleTagUpdate = () => {
    router.refresh();
    onUpdate?.();
  };

  const assignedUserIds = item.members.map((m) => m.user_id);
  const availableMembers = teamMembers.filter(
    (m) => !assignedUserIds.includes(m.id)
  );

  const getStatusIcon = () => {
    if (item.type === "ukemål" || item.type === "pipeline") {
      return item.status === "ferdig" ? "☑️" : "☐";
    }
    const icons = { planlagt: "📍", pågår: "⏳", ferdig: "✅" };
    return icons[item.status];
  };



  return (
    <div
      style={{
        backgroundColor: "white",
        borderRadius: "var(--radius-lg, 0.5rem)",
        padding: "var(--space-lg)",
        boxShadow: "var(--shadow-sm)",
        border: "1px solid var(--color-neutral-200, #e5e5e5)",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-sm)";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-md)",
        }}
      >
        {(item.type === "ukemål" || item.type === "pipeline") && (
          <button
            onClick={handleToggleStatus}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.25rem",
              padding: 0,
              marginTop: "2px",
            }}
            title={item.status === "ferdig" ? "Merk som ikke ferdig" : "Merk som ferdig"}
          >
            {getStatusIcon()}
          </button>
        )}

        {item.type === "retro" && (
          <div style={{ marginTop: "2px" }}>
            <select
              value={item.status}
              onChange={(e) =>
                handleStatusChange(e.target.value as ItemStatus)
              }
              style={{
                padding: "var(--space-xs) var(--space-sm)",
                border: "1px solid var(--color-neutral-300)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--font-size-sm)",
                cursor: "pointer",
              }}
            >
              <option value="planlagt">📍 Planlagt</option>
              <option value="pågår">⏳ Pågår</option>
              <option value="ferdig">✅ Ferdig</option>
            </select>
          </div>
        )}

        {item.type === "mål" && (
          <span
            style={{
              fontSize: "1.25rem",
              marginTop: "2px",
            }}
          >
            {getStatusIcon()}
          </span>
        )}

        <div style={{ flex: 1 }}>
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSaveTitle();
                if (e.key === "Escape") {
                  setTitle(item.title);
                  setIsEditing(false);
                }
              }}
              autoFocus
              style={{
                width: "100%",
                padding: "var(--space-sm)",
                border: "1px solid var(--color-primary)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--font-size-base)",
              }}
            />
          ) : (
            <p
              onClick={() => setIsEditing(true)}
              style={{
                margin: 0,
                cursor: "text",
                fontSize: "var(--font-size-base)",
                lineHeight: 1.5,
              }}
            >
              {item.title}
            </p>
          )}
        </div>

        <button
          onClick={handleDelete}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-neutral-400)",
            fontSize: "1.25rem",
            padding: 0,
          }}
          title="Slett"
        >
          🗑️
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-xs)",
            alignItems: "center",
          }}
        >
          {item.members.map((member) => {
            const user = teamMembers.find((m) => m.id === member.user_id);
            return (
              <PersonChip
                key={member.user_id}
                userId={member.user_id}
                displayName={user?.email.split("@")[0] || "Ukjent"}
                itemId={item.id}
                onUpdate={handleTagUpdate}
              />
            );
          })}

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowMemberDropdown(!showMemberDropdown)}
              style={{
                padding: "var(--space-xs) var(--space-sm)",
                backgroundColor: "var(--color-neutral-100)",
                border: "1px dashed var(--color-neutral-400)",
                borderRadius: "var(--radius-full)",
                cursor: "pointer",
                fontSize: "var(--font-size-sm)",
                fontWeight: 500,
              }}
            >
              + Legg til person
            </button>

            {showMemberDropdown && availableMembers.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "var(--space-xs)",
                  backgroundColor: "white",
                  border: "1px solid var(--color-neutral-300)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-md)",
                  zIndex: 10,
                  minWidth: "200px",
                }}
              >
                {availableMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleAddMember(member.id)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "var(--space-sm)",
                      border: "none",
                      background: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "var(--font-size-sm)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--color-neutral-100)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    {member.email.split("@")[0]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <SystemTagInput
          itemId={item.id}
          teamId={item.team_id}
          existingTags={item.tags.map((t) => t.tag_name)}
          onUpdate={handleTagUpdate}
        />
      </div>
    </div>
  );
}
