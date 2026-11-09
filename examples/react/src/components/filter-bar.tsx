import { FilterBar, FilterBarItem } from "@harmo-ui/react";
import { useState } from "react";

export const examples = {
  Default: () => {
    // Your router knows which is in force; here a click only moves it.
    const [status, setStatus] = useState("all");

    return (
      <FilterBar aria-label="Task status">
        <FilterBarItem href="?" label="All" count={128} current={status === "all"} onClick={() => setStatus("all")} />
        <FilterBarItem
          href="?status=active"
          label="Active"
          count={37}
          current={status === "active"}
          onClick={() => setStatus("active")}
        />
        <FilterBarItem
          href="?status=blocked"
          label="Blocked"
          count={6}
          current={status === "blocked"}
          onClick={() => setStatus("blocked")}
        />
        <FilterBarItem
          href="?status=done"
          label="Done"
          count={85}
          current={status === "done"}
          onClick={() => setStatus("done")}
        />
      </FilterBar>
    );
  },

  "Held by your app": () => {
    const [view, setView] = useState("mine");

    return (
      <FilterBar as="div" aria-label="Whose tasks">
        <FilterBarItem label="Mine" count={12} current={view === "mine"} onClick={() => setView("mine")} />
        <FilterBarItem label="My team's" count={41} current={view === "team"} onClick={() => setView("team")} />
        <FilterBarItem label="Unassigned" count={0} current={view === "none"} onClick={() => setView("none")} />
      </FilterBar>
    );
  },

  "Right to left": () => {
    const [status, setStatus] = useState("all");

    return (
      <FilterBar aria-label="حالة المهام">
        <FilterBarItem href="?" label="الكل" count="١٢٨" current={status === "all"} onClick={() => setStatus("all")} />
        <FilterBarItem
          href="?status=active"
          label="نشطة"
          count="٣٧"
          current={status === "active"}
          onClick={() => setStatus("active")}
        />
        <FilterBarItem
          href="?status=done"
          label="مكتملة"
          count="٨٥"
          current={status === "done"}
          onClick={() => setStatus("done")}
        />
      </FilterBar>
    );
  },
};
