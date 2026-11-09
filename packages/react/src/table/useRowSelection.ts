import { useCallback, useMemo, useState } from "react";

export type RowSelection = ReturnType<typeof useRowSelection>;

export const useRowSelection = () => {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((was) => {
      const next = new Set(was);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds((was) => (ids.every((id) => was.has(id)) ? new Set() : new Set(ids)));
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const isAllSelected = useCallback(
    (ids: string[]) => ids.length > 0 && ids.every((id) => selectedIds.has(id)),
    [selectedIds],
  );

  return useMemo(
    () => ({ selectedIds, count: selectedIds.size, toggle, toggleAll, clear, isSelected, isAllSelected }),
    [selectedIds, toggle, toggleAll, clear, isSelected, isAllSelected],
  );
};
