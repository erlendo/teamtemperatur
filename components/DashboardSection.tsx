"use client";

import { createItem, type TeamItem } from "@/server/actions/dashboard";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TeamItemCard } from "./TeamItemCard";

type ItemType = "ukemål" | "pipeline" | "mål" | "retro";

interface DashboardSectionProps {
  title: string;
  emoji: string;
  type: ItemType;
  items: TeamItem[];
  teamId: string;
  teamMembers: Array<{ id: string; email: string }>;
  onUpdate?: () => void;
}

export function DashboardSection({
  title,
  emoji,
  type,
  items,
  teamId,
  teamMembers,
  onUpdate,
}: DashboardSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const handleAddItem = async () => {
    if (newItemTitle.trim()) {
      try {
        const result = await createItem(teamId, type, newItemTitle.trim());
        if (result.error) {
          setErrorMsg(result.error);
          return;
        }
        setNewItemTitle("");
        setIsAdding(false);
        setErrorMsg(null);
        router.refresh();
        onUpdate?.();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        setErrorMsg(msg);
      }
    }
  };

  const handleUpdate = () => {
    router.refresh();
    onUpdate?.();
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-lg)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "var(--font-size-xl, 1.25rem)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
          }}
        >
          <span>{emoji}</span> {title}
        </h2>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              padding: "var(--space-sm) var(--space-md)",
              backgroundColor: "var(--color-primary, #3b82f6)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontSize: "var(--font-size-sm)",
              fontWeight: 500,
            }}
          >
            + Legg til
          </button>
        )}
      </div>

      {isAdding && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-sm)",
          }}
        >
          {errorMsg && (
            <p
              style={{
                color: "var(--color-error, #ef4444)",
                fontSize: "var(--font-size-sm)",
                margin: 0,
                padding: "var(--space-sm)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderRadius: "var(--radius-md)",
              }}
            >
              ❌ {errorMsg}
            </p>
          )}
          <div
            style={{
              display: "flex",
              gap: "var(--space-sm)",
            }}
          >
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAddItem();
                if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewItemTitle("");
                  setErrorMsg(null);
                }
              }}
              placeholder="Skriv inn tittel..."
              autoFocus
              style={{
                flex: 1,
                padding: "var(--space-sm) var(--space-md)",
                border: "1px solid var(--color-neutral-300)",
                borderRadius: "var(--radius-md)",
                fontSize: "var(--font-size-base)",
              }}
            />
            <button
              onClick={handleAddItem}
              style={{
                padding: "var(--space-sm) var(--space-md)",
                backgroundColor: "var(--color-primary)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontSize: "var(--font-size-sm)",
              }}
            >
              Lagre
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewItemTitle("");
                setErrorMsg(null);
              }}
              style={{
                padding: "var(--space-sm) var(--space-md)",
                backgroundColor: "var(--color-neutral-200)",
                color: "var(--color-neutral-700)",
                border: "none",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                fontSize: "var(--font-size-sm)",
              }}
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-md)",
        }}
      >
        {items.length === 0 ? (
          <p
            style={{
              color: "var(--color-neutral-500)",
              fontStyle: "italic",
              margin: 0,
            }}
          >
            Ingen {type} lagt til ennå
          </p>
        ) : (
          items.map((item) => (
            <TeamItemCard
              key={item.id}
              item={item}
              teamMembers={teamMembers}
              onUpdate={handleUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
}
