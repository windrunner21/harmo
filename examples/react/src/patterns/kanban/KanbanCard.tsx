import { Card, Link } from "@harmo-ui/react";
import type { ReactNode } from "react";
import type { KanbanCardParts } from "./KanbanBoard.tsx";

export interface KanbanCardProps {
  parts: KanbanCardParts;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  href?: string;
  onOpen?: () => void;
}

export const KanbanCard = ({ parts, title, description, children, footer, href, onOpen }: KanbanCardProps) => (
  <Card variant="raised" className="hkanban-card">
    <h3 className="hkanban-card-title">
      {href ? (
        <Link className="hkanban-card-open" href={href}>
          {title}
        </Link>
      ) : onOpen ? (
        <button type="button" className="hkanban-card-open" onClick={onOpen}>
          {title}
        </button>
      ) : (
        title
      )}
    </h3>
    {description && <p className="hkanban-card-description">{description}</p>}
    {children}
    {footer && <div className="hkanban-card-footer">{footer}</div>}
    {(parts.handle || parts.menu) && (
      <div className="hkanban-card-actions">
        {parts.handle}
        {parts.menu}
      </div>
    )}
  </Card>
);
